import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { z } from 'zod'
import { fixtureCategories, fixturePhotos, fixtureSettings } from '../fixtures/content'
import { sanitizeExif } from '../media/exif-policy'
import { migrateFlatPhotos } from './migrate-flat-photos'
import { upgradePhotoMetadata } from './upgrade-photo-metadata'
import { DuplicatePhotoError } from '../media/photo-identity'
import type { GalleryPhoto, PublicSettings } from '../../app/types/content'
import type { AdminCategory, AdminPhoto, AdminSettings, PhotoAsset } from '../../shared/types/admin'

const text = (max: number) => z.string().trim().max(max)
const updateSchema = z.object({
  title: text(120).optional(), capturedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => Number.isFinite(Date.parse(value))).optional(),
  location: text(120).optional(), note: text(1500).optional(), caption: text(300).optional(), alt: text(300).optional(),
  categorySlugs: z.array(text(80)).max(20).optional(), status: z.enum(['draft', 'published', 'deleted']).optional()
}).strict()

export class JournalStore {
  readonly db: DatabaseSync
  constructor(path: string, seed = true, originals?: string) {
    if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true })
    this.db = new DatabaseSync(path)
    try {
      this.db.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;')
      migrateFlatPhotos(this.db, path)
      this.db.exec([
        'CREATE TABLE IF NOT EXISTS metadata(key TEXT PRIMARY KEY,value TEXT NOT NULL);',
        'CREATE TABLE IF NOT EXISTS photos(id TEXT PRIMARY KEY,position INTEGER NOT NULL,payload TEXT NOT NULL);',
        'CREATE TABLE IF NOT EXISTS categories(slug TEXT PRIMARY KEY,payload TEXT NOT NULL);',
        'CREATE TABLE IF NOT EXISTS settings(id INTEGER PRIMARY KEY CHECK(id=1),payload TEXT NOT NULL);',
        'CREATE TABLE IF NOT EXISTS admins(id TEXT PRIMARY KEY,username TEXT NOT NULL UNIQUE,password_hash TEXT NOT NULL);',
        'CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY,admin_id TEXT NOT NULL REFERENCES admins(id),expires_at INTEGER NOT NULL);',
        'CREATE TABLE IF NOT EXISTS photo_view_totals(photo_id TEXT PRIMARY KEY,total INTEGER NOT NULL DEFAULT 0);',
        'CREATE TABLE IF NOT EXISTS photo_view_dedup(key TEXT PRIMARY KEY,expires_at INTEGER NOT NULL);',
        'CREATE INDEX IF NOT EXISTS view_expiry ON photo_view_dedup(expires_at);',
        "CREATE INDEX IF NOT EXISTS photo_content_hash ON photos(json_extract(payload,'$.contentHash'));"
      ].join('\n'))
      if (!this.db.prepare("SELECT 1 FROM metadata WHERE key='initialized'").get()) this.transaction(() => {
        this.db.prepare('INSERT INTO settings VALUES(1,?)').run(JSON.stringify({ heroMode: 'manual', heroPhotoId: seed ? fixtureSettings.heroPhoto?.id : null, lastValidHeroPhoto: null }))
        for (const [position, category] of fixtureCategories.entries()) this.saveCategory({ ...category, active: true, position })
        if (seed) for (const [position, photo] of fixturePhotos.entries()) {
          const record: AdminPhoto = { id: photo.id, title: photo.title, capturedOn: photo.capturedOn, note: photo.note, location: photo.location, caption: photo.caption ?? '', categorySlugs: photo.categories.map(item => item.slug), image: photo.image, exif: sanitizeExif(photo.exif), processingStatus: 'ready', status: photo.status, position, updatedAt: photo.capturedOn + 'T00:00:00Z', ...(photo.status === 'published' ? { publishedAt: photo.capturedOn + 'T00:00:00Z' } : {}) }
          this.writePhoto(record)
        }
        this.db.prepare("INSERT INTO metadata VALUES('initialized','1')").run()
      })
      upgradePhotoMetadata(this.db, originals)
    } catch (error) { this.db.close(); throw error }
  }
  transaction<T>(action: () => T): T {
    this.db.exec('BEGIN IMMEDIATE')
    try { const value = action(); this.db.exec('COMMIT'); return value } catch (error) { this.db.exec('ROLLBACK'); throw error }
  }
  private writePhoto(photo: AdminPhoto) {
    this.db.prepare('INSERT INTO photos VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET position=excluded.position,payload=excluded.payload').run(photo.id, photo.position, JSON.stringify(photo))
  }
  getPhoto(id: string): AdminPhoto | null {
    const row = this.db.prepare('SELECT payload FROM photos WHERE id=?').get(id) as { payload: string } | undefined
    return row ? JSON.parse(row.payload) : null
  }
  listPhotos(): AdminPhoto[] {
    return (this.db.prepare('SELECT payload FROM photos ORDER BY position,id').all() as { payload: string }[]).map(row => JSON.parse(row.payload) as AdminPhoto).filter(photo => photo.status !== 'deleted')
  }
  createPhoto(asset: PhotoAsset): AdminPhoto {
    return this.transaction(() => {
      if (this.getPhoto(asset.id)) throw new Error('照片已存在')
      const duplicate = asset.contentHash ? this.findDuplicate(asset.contentHash) : null
      if (duplicate) throw new DuplicatePhotoError(duplicate)
      const position = Number((this.db.prepare('SELECT coalesce(min(position),0)-1 AS position FROM photos').get() as { position: number }).position)
      const photo: AdminPhoto = { ...asset, title: (asset.image?.alt ?? '').slice(0, 120), capturedOn: asset.exif.capturedAt?.slice(0, 10) ?? new Date().toISOString().slice(0, 10), location: '', note: '', caption: '', categorySlugs: [], status: 'draft', position, updatedAt: new Date().toISOString() }
      this.writePhoto(photo); return photo
    })
  }
  findDuplicate(hash: string, excludeId = '', publishedOnly = false): AdminPhoto | null {
    const row = this.db.prepare("SELECT payload FROM photos WHERE json_extract(payload,'$.contentHash')=? AND id!=? AND json_extract(payload,'$.status')!='deleted' AND json_extract(payload,'$.processingStatus')='ready' AND (?=0 OR json_extract(payload,'$.status')='published') ORDER BY position,id LIMIT 1").get(hash, excludeId, publishedOnly ? 1 : 0) as { payload: string } | undefined
    return row ? JSON.parse(row.payload) : null
  }
  private updateOne(id: string, input: unknown): AdminPhoto {
    const photo = this.getPhoto(id)
    if (!photo || photo.status === 'deleted') throw new Error('照片不存在')
    const { alt, ...change } = updateSchema.parse(input)
    if (change.categorySlugs?.some(slug => !this.listCategories().some(category => category.slug === slug))) throw new Error('分类不存在')
    if (change.status === 'published' && (photo.processingStatus !== 'ready' || !photo.image)) throw new Error('照片处理完成后才能发布')
    const wasPublished = photo.status === 'published'
    if (wasPublished && change.status === 'published' && Object.keys(change).length === 1 && alt === undefined) return photo
    if (!wasPublished && change.status === 'published' && photo.contentHash) {
      const duplicate = this.findDuplicate(photo.contentHash, id, true)
      if (duplicate) throw new DuplicatePhotoError(duplicate, '已有相同照片发布，无需重复发布')
    }
    Object.assign(photo, change, { updatedAt: new Date().toISOString() })
    if (alt !== undefined && photo.image) photo.image.alt = alt
    if (photo.status === 'published' && !wasPublished) photo.publishedAt = photo.updatedAt
    this.writePhoto(photo); return photo
  }
  updatePhoto(id: string, input: unknown): AdminPhoto { return this.transaction(() => this.updateOne(id, input)) }
  updatePhotos(ids: string[], input: unknown): AdminPhoto[] {
    const selected = z.array(text(100).min(1)).min(1).max(1000).refine(ids => new Set(ids).size === ids.length).parse(ids)
    return this.transaction(() => selected.map(id => this.updateOne(id, input)))
  }
  replaceAsset(id: string, asset: PhotoAsset): AdminPhoto {
    return this.transaction(() => {
      const photo = this.getPhoto(id)
      if (!photo || photo.status === 'deleted' || asset.id !== id) throw new Error('照片不存在')
      const duplicate = asset.contentHash ? this.findDuplicate(asset.contentHash, id) : null
      if (duplicate) throw new DuplicatePhotoError(duplicate)
      const result = { ...photo, ...asset, ...(asset.image ? { image: { ...asset.image, alt: photo.image?.alt ?? asset.image.alt } } : {}), updatedAt: new Date().toISOString() }
      if (asset.processingStatus === 'ready') delete result.error
      else result.status = 'draft'
      this.writePhoto(result); return result
    })
  }
  reorderPhotos(ids: string[]): AdminPhoto[] {
    return this.transaction(() => {
      const photos = this.listPhotos()
      if (ids.length !== photos.length || new Set(ids).size !== ids.length || ids.some(id => !photos.some(photo => photo.id === id))) throw new Error('照片顺序已变化，请刷新后重试')
      ids.forEach((id, position) => this.writePhoto({ ...photos.find(photo => photo.id === id)!, position }))
      return this.listPhotos()
    })
  }
  listCategories(): AdminCategory[] {
    return (this.db.prepare('SELECT payload FROM categories').all() as { payload: string }[]).map(row => JSON.parse(row.payload) as AdminCategory).sort((a, b) => a.position - b.position)
  }
  saveCategory(input: unknown): AdminCategory {
    const category = z.object({ slug: text(80).min(1).regex(/^[a-z0-9-]+$/), name: text(40).min(1), active: z.boolean(), position: z.number().int().min(0).max(1000) }).parse(input)
    this.db.prepare('INSERT INTO categories VALUES(?,?) ON CONFLICT(slug) DO UPDATE SET payload=excluded.payload').run(category.slug, JSON.stringify(category))
    return category
  }
  publicPhotos(): GalleryPhoto[] {
    const categories = this.listCategories().filter(category => category.active)
    return this.listPhotos().filter(photo => photo.status === 'published' && photo.processingStatus === 'ready' && photo.image).map(photo => ({
      id: photo.id, title: photo.title, capturedOn: photo.capturedOn, location: photo.location, note: photo.note, caption: photo.caption,
      categories: categories.filter(category => photo.categorySlugs.includes(category.slug)).map(({ slug, name }) => ({ slug, name })),
      image: photo.image!, exif: sanitizeExif(photo.exif), viewCount: this.viewTotal(photo.id)
    }))
  }
  getSettings(): AdminSettings & { lastValidHeroPhoto: GalleryPhoto | null } {
    return JSON.parse((this.db.prepare('SELECT payload FROM settings WHERE id=1').get() as { payload: string }).payload)
  }
  updateSettings(input: unknown) {
    const change = z.object({ heroMode: z.enum(['manual', 'latest']), heroPhotoId: z.string().nullable().optional(), featuredPhotoIds: z.array(z.string()).max(6).refine(ids => new Set(ids).size === ids.length).optional() }).strict().parse(input)
    return this.transaction(() => {
      const settings = { ...this.getSettings(), ...change }
      if (settings.heroMode === 'manual' && settings.heroPhotoId && !this.publicPhotos().some(photo => photo.id === settings.heroPhotoId)) throw new Error('请选择已发布的照片作为首页主图')
      if (change.featuredPhotoIds?.some(id => !this.publicPhotos().some(photo => photo.id === id))) throw new Error('首页精选只能选择已发布的照片，请刷新后重新选择')
      this.db.prepare('UPDATE settings SET payload=? WHERE id=1').run(JSON.stringify(settings))
      return settings
    })
  }
  featuredPhotos(limit: number): GalleryPhoto[] {
    const photos = this.publicPhotos(), ids = this.getSettings().featuredPhotoIds ?? []
    const selected = ids.length ? ids.map(id => photos.find(photo => photo.id === id)).filter((photo): photo is GalleryPhoto => Boolean(photo)) : photos.slice(0, 4)
    return selected.slice(0, Math.max(0, Math.min(6, limit)))
  }
  publicSettings(): PublicSettings {
    const settings = this.getSettings(), photos = this.publicPhotos()
    const latest = this.listPhotos().filter(photo => photo.status === 'published' && photo.processingStatus === 'ready' && photo.image).sort((a, b) => (b.publishedAt ?? b.updatedAt).localeCompare(a.publishedAt ?? a.updatedAt) || a.position - b.position)[0]
    const selected = settings.heroMode === 'latest' ? photos.find(photo => photo.id === latest?.id) : photos.find(photo => photo.id === settings.heroPhotoId)
    const heroPhoto = selected ?? photos.find(photo => photo.id === settings.lastValidHeroPhoto?.id) ?? photos[0] ?? null
    if (settings.lastValidHeroPhoto?.id !== heroPhoto?.id) this.db.prepare('UPDATE settings SET payload=? WHERE id=1').run(JSON.stringify({ ...settings, lastValidHeroPhoto: heroPhoto }))
    return { heroMode: settings.heroMode, heroPhoto, lastValidHeroPhoto: heroPhoto }
  }
  viewTotal(id: string): number { return (this.db.prepare('SELECT total FROM photo_view_totals WHERE photo_id=?').get(id) as { total: number } | undefined)?.total ?? 0 }
  recordView(photoId: string, visitor: string, now = Date.now()) {
    if (!this.publicPhotos().some(photo => photo.id === photoId)) throw new Error('照片不存在')
    const key = createHash('sha256').update(visitor + ':' + photoId).digest('hex')
    return this.transaction(() => {
      this.db.prepare('DELETE FROM photo_view_dedup WHERE expires_at<=?').run(now)
      const inserted = this.db.prepare('INSERT OR IGNORE INTO photo_view_dedup VALUES(?,?)').run(key, now + 86400000)
      if (inserted.changes) this.db.prepare('INSERT INTO photo_view_totals VALUES(?,1) ON CONFLICT(photo_id) DO UPDATE SET total=total+1').run(photoId)
      return { total: this.viewTotal(photoId), counted: Boolean(inserted.changes) }
    })
  }
}
let store: JournalStore | undefined
export const getJournalStore = () => store ??= new JournalStore(resolve(process.env.JOURNAL_DATA_DIR || 'data', 'journal.sqlite'), process.env.JOURNAL_SEED !== 'false', resolve(process.env.JOURNAL_MEDIA_DIR || 'storage', 'private'))
