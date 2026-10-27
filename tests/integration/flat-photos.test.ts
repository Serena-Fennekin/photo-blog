import { afterEach, describe, expect, it, vi } from 'vitest'
import { DatabaseSync } from 'node:sqlite'
import { mkdtempSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { JournalStore } from '../../server/db/journal-store'

const stores: JournalStore[] = [], directories: string[] = []
afterEach(() => { vi.useRealTimers(); for (const store of stores.splice(0)) store.db.close(); for (const path of directories.splice(0)) rmSync(path, { recursive: true, force: true }) })
const store = () => { const db = new JournalStore(':memory:', false); stores.push(db); return db }
const asset = (id: string) => ({ id, processingStatus: 'ready' as const, originalKey: `${id}.original`, image: { src: `/media/${id}/1280.webp`, srcset: '', width: 800, height: 1200, alt: id }, exif: { camera: 'SONY', capturedAt: '2026-08-19T12:37:12+08:00' } })

describe('independent photos', () => {
  it('retains individual metadata and alt text when regenerating a photo asset', () => {
    const db = store(); db.createPhoto(asset('a'))
    db.updatePhoto('a', { title: '原有标题', caption: '原有说明', alt: '手动填写的替代文本', categorySlugs: ['nature'] })
    db.replaceAsset('a', asset('a'))
    expect(db.getPhoto('a')).toMatchObject({ title: '原有标题', caption: '原有说明', categorySlugs: ['nature'], image: { alt: '手动填写的替代文本' } })
  })
  it('supports more than one upload selection worth of independent photos', () => {
    const db = store(); for (let index = 0; index < 105; index++) db.createPhoto(asset('photo-' + index))
    expect(db.listPhotos()).toHaveLength(105)
  })
  it('follows latest publication independently of manual gallery order', () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-27T00:00:00Z'))
    const db = store(); db.createPhoto(asset('a')); db.createPhoto(asset('b'))
    db.updatePhoto('a', { status: 'published' }); vi.advanceTimersByTime(1000); db.updatePhoto('b', { status: 'published' })
    db.reorderPhotos(['a', 'b']); db.updateSettings({ heroMode: 'latest' })
    expect(db.publicPhotos()[0]?.id).toBe('a'); expect(db.publicSettings().heroPhoto?.id).toBe('b')
  })
  it('persists independent metadata after reopening SQLite', () => {
    const directory = mkdtempSync(join(tmpdir(), 'journal-flat-persist-')); directories.push(directory)
    const path = join(directory, 'journal.sqlite'), initial = new JournalStore(path, false)
    initial.createPhoto(asset('saved')); initial.updatePhoto('saved', { note: '保留这段文字', status: 'published' }); initial.db.close()
    const reopened = new JournalStore(path, true); stores.push(reopened)
    expect(reopened.listPhotos()).toHaveLength(1); expect(reopened.publicPhotos()[0]).toMatchObject({ id: 'saved', note: '保留这段文字' })
  })
  it('publishes and withdraws individual photos without affecting another upload', () => {
    const db = store(); db.createPhoto(asset('a')); db.createPhoto(asset('b'))
    expect(db.publicPhotos()).toEqual([])
    db.updatePhoto('a', { title: '单张照片', categorySlugs: ['nature'], status: 'published' })
    expect(db.publicPhotos().map(photo => photo.id)).toEqual(['a'])
    expect(db.getPhoto('b')?.status).toBe('draft')
    expect(db.publicPhotos()[0]).toMatchObject({ title: '单张照片', categories: [{ slug: 'nature', name: '自然' }] })
    expect(JSON.stringify(db.publicPhotos())).not.toMatch(/originalKey|storyId|coverPhotoId/)
    db.updatePhoto('a', { status: 'draft' }); expect(db.publicPhotos()).toEqual([])
  })
  it('reorders the complete flat list and rejects stale or duplicated IDs atomically', () => {
    const db = store(); for (const id of ['a', 'b', 'c']) db.createPhoto(asset(id))
    db.reorderPhotos(['a', 'c', 'b'])
    expect(db.listPhotos().map(photo => photo.id)).toEqual(['a', 'c', 'b'])
    expect(() => db.reorderPhotos(['a', 'a', 'b'])).toThrow()
    expect(() => db.reorderPhotos(['a', 'b'])).toThrow()
    expect(db.listPhotos().map(photo => photo.id)).toEqual(['a', 'c', 'b'])
  })
  it('validates bulk publication atomically and preserves metadata when retrying processing', () => {
    const db = store(); db.createPhoto(asset('a')); db.createPhoto({ id: 'b', processingStatus: 'failed', exif: {}, error: 'failed' })
    expect(() => db.updatePhotos(['a', 'b'], { status: 'published' })).toThrow()
    expect(db.getPhoto('a')?.status).toBe('draft')
    db.updatePhoto('b', { title: '保留的标题', note: '随笔', categorySlugs: ['nature'] })
    db.replaceAsset('b', asset('b'))
    expect(db.getPhoto('b')).toMatchObject({ title: '保留的标题', note: '随笔', categorySlugs: ['nature'], processingStatus: 'ready' })
    db.updatePhotos(['a', 'b'], { status: 'published' }); expect(db.publicPhotos()).toHaveLength(2)
    db.updatePhoto('a', { status: 'deleted' }); expect(db.publicPhotos().map(photo => photo.id)).toEqual(['b'])
  })
  it('selects an independent homepage photo and never retains withdrawn metadata', () => {
    const db = store(); db.createPhoto(asset('a')); db.createPhoto(asset('b')); db.updatePhotos(['a', 'b'], { status: 'published' })
    db.updateSettings({ heroMode: 'manual', heroPhotoId: 'a' }); expect(db.publicSettings().heroPhoto?.id).toBe('a')
    db.updatePhoto('a', { status: 'draft' }); expect(db.publicSettings().heroPhoto?.id).toBe('b')
    db.updatePhoto('b', { status: 'draft' }); expect(db.publicSettings().heroPhoto).toBeNull()
  })
  it('keeps photo counters and draft isolation with 24-hour deduplication', () => {
    const db = store(); db.createPhoto(asset('a')); expect(() => db.recordView('a', 'visitor', 1000)).toThrow()
    db.updatePhoto('a', { status: 'published' }); expect(db.recordView('a', 'visitor', 1000)).toEqual({ total: 1, counted: true })
    expect(db.recordView('a', 'visitor', 1001)).toEqual({ total: 1, counted: false })
    expect(db.recordView('a', 'visitor', 86401001)).toEqual({ total: 2, counted: true })
  })
})

describe('legacy photo migration', () => {
  it('rolls back migration and closes the database when legacy content is malformed', () => {
    const directory = mkdtempSync(join(tmpdir(), 'journal-flat-rollback-')); directories.push(directory)
    const path = join(directory, 'journal.sqlite'), legacy = new DatabaseSync(path)
    legacy.exec('PRAGMA foreign_keys=ON; CREATE TABLE stories(id TEXT PRIMARY KEY,payload TEXT); CREATE TABLE photos(id TEXT PRIMARY KEY,story_id TEXT REFERENCES stories(id),position INTEGER,payload TEXT);')
    legacy.prepare('INSERT INTO stories VALUES(?,?)').run('owner', '{}')
    legacy.prepare('INSERT INTO photos VALUES(?,?,?,?)').run('original-id', 'owner', 0, 'invalid-json')
    legacy.close()
    expect(() => new JournalStore(path, false)).toThrow()
    const original = new DatabaseSync(path)
    try {
      expect(original.prepare('SELECT id FROM photos').get()?.id).toBe('original-id')
      expect(original.prepare('PRAGMA table_info(photos)').all().some(column => column.name === 'story_id')).toBe(true)
      expect(original.prepare("SELECT name FROM sqlite_master WHERE name='stories'").get()).toBeDefined()
      expect(original.prepare('PRAGMA integrity_check').get()?.integrity_check).toBe('ok')
    } finally { original.close() }
    expect(readdirSync(join(directory, 'backups'))).toHaveLength(1)
  })
  it('backs up and flattens existing photos without changing IDs, EXIF, counters or administrator data', () => {
    const directory = mkdtempSync(join(tmpdir(), 'journal-flat-')); directories.push(directory)
    const path = join(directory, 'journal.sqlite'), legacy = new DatabaseSync(path)
    legacy.exec(`CREATE TABLE metadata(key TEXT PRIMARY KEY,value TEXT NOT NULL); INSERT INTO metadata VALUES('initialized','1');
      CREATE TABLE stories(id TEXT PRIMARY KEY,slug TEXT,payload TEXT); CREATE TABLE photos(id TEXT PRIMARY KEY,story_id TEXT,position INTEGER,payload TEXT);
      CREATE TABLE settings(id INTEGER PRIMARY KEY,payload TEXT); CREATE TABLE categories(slug TEXT PRIMARY KEY,payload TEXT);
      CREATE TABLE admins(id TEXT PRIMARY KEY,username TEXT,password_hash TEXT); INSERT INTO admins VALUES('owner','owner','hash');
      CREATE TABLE photo_view_totals(photo_id TEXT PRIMARY KEY,total INTEGER); INSERT INTO photo_view_totals VALUES('old-a',7);`)
    legacy.prepare('INSERT INTO settings VALUES(1,?)').run(JSON.stringify({ heroMode: 'manual', heroPhotoId: 'old-a', lastValidHeroPhoto: null }))
    for (const [id, status] of [['published', 'published'], ['draft', 'draft'], ['deleted', 'deleted'], ['failed', 'published'], ['missing-cover', 'published']]) {
      legacy.prepare('INSERT INTO stories VALUES(?,?,?)').run(id, id, JSON.stringify({ id, coverPhotoId: id === 'published' ? 'old-a' : id === 'missing-cover' ? 'absent' : id, title: '原有标题', capturedOn: '2026-08-19', location: '杭州', note: '原有随笔', categorySlugs: ['nature'], status, updatedAt: '2026-10-27T00:00:00Z' }))
      const photo = asset(id === 'published' ? 'old-a' : id)
      legacy.prepare('INSERT INTO photos VALUES(?,?,?,?)').run(photo.id, id, 0, JSON.stringify({ ...photo, status: id === 'failed' ? 'failed' : 'ready', caption: '原有说明' }))
    }
    legacy.prepare('INSERT INTO photos VALUES(?,?,?,?)').run('hidden-ready', 'failed', 1, JSON.stringify({ ...asset('hidden-ready'), status: 'ready' }))
    legacy.close()
    const migrated = new JournalStore(path, false)
    stores.push(migrated)
    expect(migrated.getPhoto('old-a')).toMatchObject({ title: '原有标题', caption: '原有说明', note: '原有随笔', location: '杭州', status: 'published', originalKey: 'old-a.original', exif: { capturedAt: '2026-08-19T12:37:12+08:00' } })
    expect(migrated.publicPhotos().map(photo => photo.id)).toEqual(['old-a'])
    expect(migrated.getPhoto('failed')).toMatchObject({ processingStatus: 'failed', status: 'draft' })
    expect(migrated.getPhoto('hidden-ready')?.status).toBe('draft')
    expect(migrated.getPhoto('missing-cover')?.status).toBe('draft')
    expect(migrated.viewTotal('old-a')).toBe(7)
    expect(migrated.db.prepare('SELECT count(*) AS total FROM admins').get()?.total).toBe(1)
    expect(migrated.db.prepare("SELECT name FROM sqlite_master WHERE name='stories'").get()).toBeUndefined()
    expect(migrated.db.prepare('PRAGMA table_info(photos)').all().map(column => column.name)).not.toContain('story_id')
    expect(readdirSync(join(directory, 'backups'))).toHaveLength(1)
    stores.splice(stores.indexOf(migrated), 1); migrated.db.close()
    const reopened = new JournalStore(path, true); stores.push(reopened)
    expect(reopened.listPhotos()).toHaveLength(5)
    expect(reopened.publicSettings().heroPhoto?.id).toBe('old-a')
    expect(readdirSync(join(directory, 'backups'))).toHaveLength(1)
  })
})
