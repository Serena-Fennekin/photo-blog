import { afterEach, describe, expect, it, vi } from 'vitest'
import { createHash, randomUUID } from 'node:crypto'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { JournalStore } from '../../server/db/journal-store'
import { createSqliteContentRepository } from '../../server/repositories/sqlite-content-repository'

const stores: JournalStore[] = [], directories: string[] = []
afterEach(() => { vi.useRealTimers(); for (const db of stores.splice(0)) db.db.close(); for (const path of directories.splice(0)) rmSync(path, { recursive: true, force: true }) })
const open = (path = ':memory:', originals?: string) => { const db = new JournalStore(path, false, originals); stores.push(db); return db }
const asset = (id: string, bytes = id) => ({ id, processingStatus: 'ready' as const, contentHash: createHash('sha256').update(bytes).digest('hex'), originalKey: id + '.original', image: { src: '/media/' + id + '/1280.webp', srcset: '', width: 800, height: 1200, alt: '小猫' }, exif: { capturedAt: '2026-08-19T12:37:12+08:00' } })

describe('homepage library and duplicate feedback', () => {
  it('rejects a renamed identical original without creating another photo and permits a removed photo to be uploaded again', () => {
    const db = open(); db.createPhoto(asset('a', 'same bytes')); db.updatePhoto('a', { title: '已经上传的小猫', status: 'published' })
    expect(() => db.createPhoto(asset('b', 'same bytes'))).toThrow(/已经上传/)
    expect(db.listPhotos()).toHaveLength(1)
    expect(db.findDuplicate(asset('x', 'same bytes').contentHash)?.id).toBe('a')
    expect(() => db.createPhoto(asset('c', 'different bytes'))).not.toThrow()
    db.updatePhoto('a', { status: 'deleted' }); expect(() => db.createPhoto(asset('d', 'same bytes'))).not.toThrow()
    expect(JSON.stringify(db.publicPhotos())).not.toContain('contentHash')
  })
  it('does not rewrite publication timestamps when publishing an already-published photo', () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-28T01:00:00Z'))
    const db = open(); db.createPhoto(asset('a')); const before = db.updatePhoto('a', { status: 'published' })
    vi.setSystemTime(new Date('2026-10-28T02:00:00Z'))
    expect(db.updatePhotos(['a'], { status: 'published' })[0]).toEqual(before)
  })
  it('warns before publishing a duplicate legacy draft when its identical original is already public', () => {
    const db = open(), first = asset('a', 'old repeated original')
    db.createPhoto(first)
    const { contentHash: _hash, ...legacy } = asset('b', 'old repeated original')
    db.createPhoto(legacy)
    db.db.prepare('UPDATE photos SET payload=? WHERE id=?').run(JSON.stringify({ ...db.getPhoto('b'), contentHash: first.contentHash }), 'b')
    expect(() => db.updatePhoto('a', { status: 'published' })).not.toThrow()
    expect(() => db.updatePhoto('b', { status: 'published' })).toThrow(/相同照片发布/)
    expect(db.publicPhotos().map(photo => photo.id)).toEqual(['a'])
  })
  it('caps default homepage content at four and persists at most six explicit published selections', async () => {
    const db = open()
    for (let i = 0; i < 10; i++) { db.createPhoto(asset('p' + i)); db.updatePhoto('p' + i, { status: 'published' }) }
    const repository = createSqliteContentRepository(db)
    expect(await repository.listHomePhotos(100)).toHaveLength(4)
    db.updateSettings({ heroMode: 'manual', featuredPhotoIds: ['p2', 'p0'] })
    expect((await repository.listHomePhotos(100)).map(photo => photo.id)).toEqual(['p2', 'p0'])
    expect((await repository.listGallery({ limit: 20 })).items).toHaveLength(10)
    expect(() => db.updateSettings({ heroMode: 'manual', featuredPhotoIds: ['p0', 'p0'] })).toThrow()
    expect(() => db.updateSettings({ heroMode: 'manual', featuredPhotoIds: Array.from({ length: 7 }, (_, i) => 'p' + i) })).toThrow()
    db.updatePhoto('p2', { status: 'draft' })
    expect((await repository.listHomePhotos(100)).map(photo => photo.id)).toEqual(['p0'])
    expect(() => db.updateSettings({ heroMode: 'manual', featuredPhotoIds: ['p2'] })).toThrow()
  })
  it('backfills old original hashes, cleans existing city copy once, and preserves original EXIF and counters', () => {
    const dir = mkdtempSync(join(tmpdir(), 'journal-home-')); directories.push(dir)
    const originals = join(dir, 'private'); mkdirSync(originals)
    const id = randomUUID(), missing = randomUUID(), path = join(dir, 'journal.sqlite'), db = open(path)
    const { contentHash: _hash, ...legacy } = asset(id, 'legacy original')
    db.createPhoto(legacy); db.createPhoto({ ...legacy, id: missing, originalKey: missing + '.original' })
    db.updatePhoto(id, { title: '\u676d\u5dde的小猫', location: 'Hang Zhou', status: 'published' }); db.recordView(id, 'visitor')
    db.db.prepare("DELETE FROM metadata WHERE key='everyday-copy-v1'").run()
    const before = db.getPhoto(id)!
    db.db.close(); stores.splice(stores.indexOf(db), 1)
    writeFileSync(join(originals, id + '.original'), 'legacy original')
    const reopened = open(path, originals), after = reopened.getPhoto(id)!
    expect(reopened.findDuplicate(asset('new', 'legacy original').contentHash)?.id).toBe(id)
    expect(after).toMatchObject({ id, title: '的小猫', location: '', originalKey: before.originalKey, exif: before.exif, publishedAt: before.publishedAt, updatedAt: before.updatedAt })
    expect(reopened.viewTotal(id)).toBe(1)
    expect(reopened.getPhoto(missing)).not.toBeNull()
    reopened.updatePhoto(id, { location: '\u676d\u5dde' })
    expect(reopened.db.prepare('PRAGMA integrity_check').get()).toEqual({ integrity_check: 'ok' })
  })
})
