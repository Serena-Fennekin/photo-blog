import { describe, expect, it } from 'vitest'

import { createFixtureContentRepository } from '../../server/repositories/fixture-content-repository'

describe('fixture content repository contract', () => {
  it('returns only published stories in reverse chronological order', async () => {
    const repository = createFixtureContentRepository()

    const stories = await repository.listHomeStories(10)

    expect(stories.map(story => story.slug)).toEqual(['winter-light', 'river-walk'])
  })

  it('paginates gallery photos without repeating the cursor item', async () => {
    const repository = createFixtureContentRepository()

    const firstPage = await repository.listGallery({ limit: 2 })
    const secondPage = await repository.listGallery({ cursor: firstPage.nextCursor ?? undefined, limit: 2 })

    expect(firstPage.items.map(photo => photo.id)).toEqual(['winter-1', 'winter-2'])
    expect(firstPage.nextCursor).toBe('winter-2')
    expect(secondPage.items.map(photo => photo.id)).toEqual(['winter-3', 'river-1'])
  })

  it('filters the mixed gallery by category', async () => {
    const repository = createFixtureContentRepository()

    const page = await repository.listGallery({ category: 'nature', limit: 20 })

    expect(page.items.map(photo => photo.id)).toEqual(['winter-1', 'winter-2', 'winter-3'])
    expect(page.categories).toEqual([
      { slug: 'portrait', name: '人像' },
      { slug: 'nature', name: '自然' }
    ])
  })

  it('returns ordered siblings and the active index for a photo', async () => {
    const repository = createFixtureContentRepository()

    const context = await repository.getPhotoContext('winter-2')

    expect(context?.siblings.map(photo => photo.id)).toEqual(['winter-1', 'winter-2', 'winter-3'])
    expect(context?.index).toBe(1)
    expect(Object.keys(context?.photo.exif ?? {}).sort()).toEqual([
      'aperture',
      'camera',
      'capturedAt',
      'focalLengthMm',
      'iso',
      'lens',
      'shutter'
    ])
  })

  it('returns null for an unknown story slug', async () => {
    const repository = createFixtureContentRepository()

    await expect(repository.getStoryBySlug('missing-story')).resolves.toBeNull()
  })
})
