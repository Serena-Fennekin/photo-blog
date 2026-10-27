import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { createHash, randomUUID } from 'node:crypto'
import { z } from 'zod'
import { fixtureCategories, fixtureSettings, fixtureStories } from '../fixtures/content'
import { sanitizeExif } from '../media/exif-policy'
import type { GalleryPhoto, PublicSettings, StoryDetail } from '../../app/types/content'
import type { AdminCategory, AdminPhoto, AdminSettings, AdminStory } from '../../shared/types/admin'

const text = (max: number) => z.string().trim().max(max)
const updateSchema = z.object({
  title: text(120).min(1).optional(), slug: text(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  capturedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => Number.isFinite(Date.parse(value))).optional(),
  location: text(120).optional(), note: text(1500).optional(),
  categorySlugs: z.array(text(80)).max(20).optional(),
  coverPhotoId: text(100).nullable().optional(), status: z.enum(['draft', 'published', 'deleted']).optional(),
  photos: z.array(z.object({ id: text(100), caption: text(300).default(''), alt: text(300).default('') })).max(100).optional()
}).strict()

export class JournalStore {
  readonly db: DatabaseSync
  constructor(path: string, seed = true) {
    if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true })
    this.db = new DatabaseSync(path)
    this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS metadata(key TEXT PRIMARY KEY,value TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS stories(id TEXT PRIMARY KEY,slug TEXT NOT NULL UNIQUE,payload TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS photos(id TEXT PRIMARY KEY,story_id TEXT NOT NULL REFERENCES stories(id),position INTEGER NOT NULL,payload TEXT NOT NULL);
      CREATE INDEX IF NOT EXISTS photos_story ON photos(story_id,position);
      CREATE TABLE IF NOT EXISTS categories(slug TEXT PRIMARY KEY,payload TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS settings(id INTEGER PRIMARY KEY CHECK(id=1),payload TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS admins(id TEXT PRIMARY KEY,username TEXT NOT NULL UNIQUE,password_hash TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY,admin_id TEXT NOT NULL REFERENCES admins(id),expires_at INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS photo_view_totals(photo_id TEXT PRIMARY KEY,total INTEGER NOT NULL DEFAULT 0);
      CREATE TABLE IF NOT EXISTS photo_view_dedup(key TEXT PRIMARY KEY,expires_at INTEGER NOT NULL);
      CREATE INDEX IF NOT EXISTS view_expiry ON photo_view_dedup(expires_at);`)
    if (!this.db.prepare("SELECT 1 FROM metadata WHERE key='initialized'").get()) this.transaction(() => {
      this.db.prepare('INSERT INTO settings VALUES(1,?)').run(JSON.stringify({ heroMode: 'manual', heroPhotoId: seed ? fixtureSettings.heroPhoto?.id : null, lastValidHeroPhoto: seed ? fixtureSettings.lastValidHeroPhoto : null }))
      for (const [position, category] of fixtureCategories.entries()) this.saveCategory({ ...category, active: true, position })
      if (seed) for (const story of fixtureStories) {
        const record: AdminStory = { id: story.id, slug: story.slug, title: story.title, capturedOn: story.capturedOn, note: story.note ?? '', location: story.location ?? '', status: story.status, categorySlugs: story.categories.map(item => item.slug), coverPhotoId: story.cover.id, photos: story.photos.map(photo => ({ id: photo.id, status: 'ready', image: photo.image, exif: sanitizeExif(photo.exif), caption: photo.caption })), updatedAt: new Date().toISOString() }
        this.writeStory(record)
      }
      this.db.prepare("INSERT INTO metadata VALUES('initialized','1')").run()
    })
  }

  transaction<T>(action: () => T): T {
    this.db.exec('BEGIN IMMEDIATE')
    try { const value = action(); this.db.exec('COMMIT'); return value } catch (error) { this.db.exec('ROLLBACK'); throw error }
  }

  private writeStory(story: AdminStory) {
    const { photos, ...payload } = story
    this.db.prepare('INSERT INTO stories VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET slug=excluded.slug,payload=excluded.payload').run(story.id, story.slug, JSON.stringify(payload))
    this.db.prepare('DELETE FROM photos WHERE story_id=?').run(story.id)
    const insert = this.db.prepare('INSERT INTO photos VALUES(?,?,?,?)')
    photos.forEach((photo, position) => insert.run(photo.id, story.id, position, JSON.stringify(photo)))
  }

  getStory(id: string): AdminStory | null {
    const row = this.db.prepare('SELECT payload FROM stories WHERE id=?').get(id) as { payload: string } | undefined
    if (!row) return null
    return { ...JSON.parse(row.payload), photos: (this.db.prepare('SELECT payload FROM photos WHERE story_id=? ORDER BY position').all(id) as { payload: string }[]).map(photo => JSON.parse(photo.payload)) }
  }

  listStories(): AdminStory[] {
    return (this.db.prepare('SELECT id FROM stories').all() as { id: string }[]).map(row => this.getStory(row.id)!).filter(story => story.status !== 'deleted').sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }

  createStory(input: unknown): AdminStory {
    const parsed = updateSchema.pick({ title: true, capturedOn: true }).parse(input)
    const id = randomUUID()
    const story: AdminStory = { id, slug: `story-${id}`, title: parsed.title || '未命名记录', capturedOn: parsed.capturedOn || new Date().toISOString().slice(0, 10), location: '', note: '', categorySlugs: [], coverPhotoId: null, photos: [], status: 'draft', updatedAt: new Date().toISOString() }
    this.transaction(() => this.writeStory(story)); return story
  }

  updateStory(id: string, input: unknown): AdminStory {
    return this.transaction(() => {
      const story = this.getStory(id)
      if (!story || story.status === 'deleted') throw new Error('记录不存在')
      const { photos, ...changes } = updateSchema.parse(input)
      if (changes.categorySlugs?.some(slug => !this.listCategories().some(category => category.slug === slug))) throw new Error('分类不存在')
      if (photos) {
        if (photos.length !== story.photos.length || new Set(photos.map(photo => photo.id)).size !== photos.length || photos.some(photo => !story.photos.some(existing => existing.id === photo.id))) throw new Error('照片顺序包含无效或缺少的照片')
        story.photos = photos.map(input => { const photo = story.photos.find(photo => photo.id === input.id)!; return { ...photo, caption: input.caption, ...(photo.image ? { image: { ...photo.image, alt: input.alt } } : {}) } })
      }
      const wasPublished = story.status === 'published'
      Object.assign(story, changes, { updatedAt: new Date().toISOString() })
      if (story.status === 'published' && !wasPublished) story.publishedAt = story.updatedAt
      if (story.status === 'published' && !story.photos.some(photo => photo.id === story.coverPhotoId && photo.status === 'ready' && photo.image)) throw new Error('发布前请上传照片并选择有效封面')
      this.writeStory(story)
      return story
    })
  }

  addPhoto(storyId: string, photo: AdminPhoto): AdminStory {
    return this.transaction(() => {
      const story = this.getStory(storyId)
      if (!story || story.status === 'deleted') throw new Error('记录不存在')
      const index = story.photos.findIndex(item => item.id === photo.id)
      if (index < 0 && story.photos.length >= 100) throw new Error('每组最多100张照片')
      if (index >= 0) story.photos[index] = photo
      else story.photos.push(photo)
      if (!story.coverPhotoId && photo.status === 'ready') story.coverPhotoId = photo.id
      story.updatedAt = new Date().toISOString()
      this.writeStory(story); return story
    })
  }

  removePhoto(storyId: string, photoId: string) {
    return this.transaction(() => {
      const story = this.getStory(storyId)
      if (!story) throw new Error('记录不存在')
      story.photos = story.photos.filter(photo => photo.id !== photoId)
      if (story.coverPhotoId === photoId) story.coverPhotoId = story.photos.find(photo => photo.status === 'ready')?.id ?? null
      if (!story.coverPhotoId) story.status = 'draft'
      story.updatedAt = new Date().toISOString()
      this.writeStory(story); return story
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

  publicStories(): StoryDetail[] {
    const categories = this.listCategories()
    return this.listStories().filter(story => story.status === 'published').sort((a, b) => b.capturedOn.localeCompare(a.capturedOn) || (b.publishedAt ?? b.updatedAt).localeCompare(a.publishedAt ?? a.updatedAt) || a.id.localeCompare(b.id)).flatMap(story => {
      const photos: GalleryPhoto[] = story.photos.filter(photo => photo.status === 'ready' && photo.image).map(photo => ({ id: photo.id, storyId: story.id, storySlug: story.slug, storyTitle: story.title, caption: photo.caption, image: photo.image!, exif: sanitizeExif(photo.exif), viewCount: this.viewTotal(photo.id) }))
      const cover = photos.find(photo => photo.id === story.coverPhotoId)
      if (!cover) return []
      return [{ id: story.id, slug: story.slug, title: story.title, note: story.note, location: story.location, capturedOn: story.capturedOn, categories: categories.filter(category => story.categorySlugs.includes(category.slug)).map(({ slug, name }) => ({ slug, name })), cover, previewPhotos: photos.slice(0, 2), photos }]
    })
  }

  getSettings(): AdminSettings & { lastValidHeroPhoto: GalleryPhoto | null } {
    return JSON.parse((this.db.prepare('SELECT payload FROM settings WHERE id=1').get() as { payload: string }).payload)
  }
  updateSettings(input: unknown) {
    const change = z.object({ heroMode: z.enum(['manual', 'latest']), heroPhotoId: z.string().nullable().optional() }).strict().parse(input)
    return this.transaction(() => {
      const settings = { ...this.getSettings(), ...change }
      const photos = this.publicStories().flatMap(story => story.photos)
      if (settings.heroMode === 'manual' && settings.heroPhotoId) {
        const photo = photos.find(photo => photo.id === settings.heroPhotoId)
        if (!photo) throw new Error('请选择已发布的照片作为首页封面')
        settings.lastValidHeroPhoto = photo
      } else if (settings.heroMode === 'latest' && this.publicStories()[0]) settings.lastValidHeroPhoto = this.publicStories()[0]!.cover
      this.db.prepare('UPDATE settings SET payload=? WHERE id=1').run(JSON.stringify(settings))
      return settings
    })
  }
  publicSettings(): PublicSettings {
    const settings = this.getSettings(), stories = this.publicStories()
    const photos = stories.flatMap(story => story.photos)
    const selected = settings.heroMode === 'latest' ? stories[0]?.cover : photos.find(photo => photo.id === settings.heroPhotoId)
    const lastValidHeroPhoto = selected ?? photos.find(photo => photo.id === settings.lastValidHeroPhoto?.id) ?? stories[0]?.cover ?? null
    if (settings.lastValidHeroPhoto?.id !== lastValidHeroPhoto?.id) this.db.prepare('UPDATE settings SET payload=? WHERE id=1').run(JSON.stringify({ ...settings, lastValidHeroPhoto }))
    return { heroMode: settings.heroMode, heroPhoto: lastValidHeroPhoto, lastValidHeroPhoto }
  }
  viewTotal(id: string): number { return (this.db.prepare('SELECT total FROM photo_view_totals WHERE photo_id=?').get(id) as { total: number } | undefined)?.total ?? 0 }
  recordView(photoId: string, visitor: string, now = Date.now()) {
    if (!this.publicStories().some(story => story.photos.some(photo => photo.id === photoId))) throw new Error('照片不存在')
    const key = createHash('sha256').update(`${visitor}:${photoId}`).digest('hex')
    return this.transaction(() => {
      this.db.prepare('DELETE FROM photo_view_dedup WHERE expires_at<=?').run(now)
      const inserted = this.db.prepare('INSERT OR IGNORE INTO photo_view_dedup VALUES(?,?)').run(key, now + 86400000)
      if (inserted.changes) this.db.prepare('INSERT INTO photo_view_totals VALUES(?,1) ON CONFLICT(photo_id) DO UPDATE SET total=total+1').run(photoId)
      return { total: this.viewTotal(photoId), counted: Boolean(inserted.changes) }
    })
  }
}

let store: JournalStore | undefined
export const getJournalStore = () => store ??= new JournalStore(resolve(process.env.JOURNAL_DATA_DIR || 'data', 'journal.sqlite'), process.env.JOURNAL_SEED !== 'false')
