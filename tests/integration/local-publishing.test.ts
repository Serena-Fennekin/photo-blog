import { afterEach, describe, expect, it, vi } from 'vitest'
import { JournalStore } from '../../server/db/journal-store'
import { createSqliteContentRepository } from '../../server/repositories/sqlite-content-repository'
import { sanitizeExif } from '../../server/media/exif-policy'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const stores: JournalStore[] = []
const setup = () => { const store = new JournalStore(':memory:', false); stores.push(store); return store }
afterEach(() => { for (const store of stores.splice(0)) store.db.close() })

describe('persistent publishing lifecycle', () => {
  it('uses publication order when several groups share the same capture date', () => {
    vi.useFakeTimers()
    try {
      vi.setSystemTime(new Date('2026-10-27T01:00:00Z'))
      const store = new JournalStore(':memory:', true); stores.push(store)
      store.updateStory('story-winter', { status: 'draft' })
      store.updateStory('story-river', { capturedOn: '2025-12-16' })
      vi.setSystemTime(new Date('2026-10-27T01:00:02Z'))
      store.updateStory('story-winter', { status: 'published' })
      store.updateSettings({ heroMode: 'latest' })
      expect(store.publicStories()[0]?.id).toBe('story-winter')
      expect(store.publicSettings().heroPhoto?.storyId).toBe('story-winter')
    } finally { vi.useRealTimers() }
  })
  it('retries an existing failed photo even when a group already has 100 entries', () => {
    const store = setup(), story = store.createStory({ title: '批量上传', capturedOn: '2026-10-27' })
    for (let index = 0; index < 100; index++) store.addPhoto(story.id, { id: `photo-${index}`, status: 'failed', exif: {} })
    expect(() => store.addPhoto(story.id, { id: 'photo-0', status: 'failed', exif: {}, error: 'retry attempted' })).not.toThrow()
    expect(store.getStory(story.id)?.photos).toHaveLength(100)
    expect(() => store.addPhoto(story.id, { id: 'extra', status: 'failed', exif: {} })).toThrow()
  })
  it('falls back to another public cover instead of exposing an unpublished photo', () => {
    const store = new JournalStore(':memory:', true); stores.push(store)
    store.updateSettings({ heroMode: 'manual', heroPhotoId: 'winter-1' })
    store.updateStory('story-winter', { status: 'draft' })
    expect(store.publicSettings().heroPhoto?.id).toBe('river-1')
    expect(store.publicSettings().lastValidHeroPhoto?.id).toBe('river-1')
    store.updateStory('story-river', { status: 'draft' })
    expect(store.publicSettings().heroPhoto).toBeNull()
    expect(store.publicSettings().lastValidHeroPhoto).toBeNull()
  })
  it('retains saved content after closing and reopening a real database', () => {
    const directory = mkdtempSync(join(tmpdir(), 'journal-db-'))
    try {
      const first = new JournalStore(join(directory, 'journal.sqlite'), false)
      const story = first.createStory({ title: '保留的草稿', capturedOn: '2026-10-27' })
      first.db.close()
      const reopened = new JournalStore(join(directory, 'journal.sqlite'), true)
      try { expect(reopened.getStory(story.id)?.title).toBe('保留的草稿'); expect(reopened.listStories()).toHaveLength(1) } finally { reopened.db.close() }
    } finally { rmSync(directory, { recursive: true, force: true }) }
  })
  it('keeps drafts private, validates the cover, publishes and withdraws a group', async () => {
    const store = setup(), repository = createSqliteContentRepository(store)
    const story = store.createStory({ title: '江边', capturedOn: '2026-10-27' })
    expect(await repository.getStoryBySlug(story.slug)).toBeNull()
    expect(() => store.updateStory(story.id, { status: 'published' })).toThrow()
    store.addPhoto(story.id, { id: 'test-photo', status: 'ready', originalKey: 'private-secret', image: { src: '/media/test/1280.webp', srcset: '', width: 1200, height: 800, alt: '江边的光' }, exif: { camera: 'SONY' } })
    expect(() => store.updateStory(story.id, { coverPhotoId: 'not-in-story', status: 'published' })).toThrow()
    store.updateStory(story.id, { status: 'published', coverPhotoId: 'test-photo' })
    const published = await repository.getStoryBySlug(story.slug)
    expect(published?.photos).toHaveLength(1)
    expect(JSON.stringify(published)).not.toContain('private-secret')
    store.updateStory(story.id, { status: 'draft' })
    expect(await repository.getPhotoContext('test-photo')).toBeNull()
  })

  it('deduplicates real photo views for 24 hours and rejects private photos', () => {
    const store = new JournalStore(':memory:', true); stores.push(store)
    expect(store.recordView('winter-1', 'visitor-a', 1000)).toEqual({ total: 1, counted: true })
    expect(store.recordView('winter-1', 'visitor-a', 1001)).toEqual({ total: 1, counted: false })
    expect(store.recordView('winter-1', 'visitor-b', 1002)).toEqual({ total: 2, counted: true })
    expect(store.recordView('winter-1', 'visitor-a', 86401001)).toEqual({ total: 3, counted: true })
    expect(() => store.recordView('draft-1', 'visitor-a', 1000)).toThrow()
  })

  it('persists ordering, refuses foreign photos and resolves manual/latest hero modes', async () => {
    const store = new JournalStore(':memory:', true); stores.push(store)
    const story = store.getStory('story-winter')!
    const reversed = [...story.photos].reverse().map(photo => ({ id: photo.id, caption: '', alt: photo.image?.alt ?? '' }))
    store.updateStory(story.id, { photos: reversed })
    expect(store.getStory(story.id)?.photos[0]?.id).toBe('winter-3')
    expect(() => store.updateStory(story.id, { photos: [{ id: 'river-1', alt: '', caption: '' }] })).toThrow()
    store.updateSettings({ heroMode: 'manual', heroPhotoId: 'river-1' })
    expect((await createSqliteContentRepository(store).getPublicSettings()).heroPhoto?.id).toBe('river-1')
    expect(() => store.updateSettings({ heroMode: 'manual', heroPhotoId: 'draft-1' })).toThrow()
    store.updateSettings({ heroMode: 'latest' })
    expect(store.getSettings().heroMode).toBe('latest')
  })

  it('removes GPS and serial numbers and normalizes camera EXIF', () => {
    expect(sanitizeExif({ Make: 'SONY', Model: 'ILCE-7M4', LensModel: '50mm', FNumber: 2.8, ISO: 100, ExposureTime: 0.002, GPSLatitude: 30, SerialNumber: 'SECRET' })).toEqual({ camera: 'SONY ILCE-7M4', lens: '50mm', aperture: 2.8, iso: 100, shutter: '1/500' })
  })
})
