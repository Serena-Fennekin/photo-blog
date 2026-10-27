import { describe, expect, it } from 'vitest'
import { createFixtureContentRepository } from '../../server/repositories/fixture-content-repository'
describe('flat fixture repository', () => {
  it('returns independently published homepage photos', async () => {
    const photos = await createFixtureContentRepository().listHomePhotos(10)
    expect(photos.map(photo => photo.id)).toEqual(['winter-1', 'winter-2', 'winter-3', 'river-1', 'river-2'])
    expect(JSON.stringify(photos)).not.toMatch(/storyId|storySlug|coverPhotoId/)
  })
  it('paginates without repeating the cursor photo', async () => {
    const repository = createFixtureContentRepository()
    const first = await repository.listGallery({ limit: 2 }), next = await repository.listGallery({ cursor: first.nextCursor!, limit: 2 })
    expect(first.items.map(photo => photo.id)).toEqual(['winter-1', 'winter-2'])
    expect(next.items.map(photo => photo.id)).toEqual(['winter-3', 'river-1'])
  })
  it('filters each photo by its own categories', async () => {
    const page = await createFixtureContentRepository().listGallery({ category: 'nature', limit: 20 })
    expect(page.items.map(photo => photo.id)).toEqual(['winter-1', 'winter-2', 'winter-3'])
    expect(page.categories).toEqual([{ slug: 'portrait', name: '人像' }, { slug: 'nature', name: '自然' }])
  })
  it('navigates the full gallery instead of stopping at a former batch boundary', async () => {
    const context = await createFixtureContentRepository().getPhotoContext('winter-3')
    expect(context?.siblings.map(photo => photo.id)).toEqual(['winter-1', 'winter-2', 'winter-3', 'river-1', 'river-2'])
    expect(context?.index).toBe(2)
    expect(Object.keys(context!.photo.exif).sort()).toEqual(['aperture', 'camera', 'capturedAt', 'focalLengthMm', 'iso', 'lens', 'shutter'])
  })
  it('does not expose draft or unknown photos', async () => {
    const repository = createFixtureContentRepository()
    expect(await repository.getPhotoContext('draft-1')).toBeNull()
    expect(await repository.getPhotoContext('missing')).toBeNull()
  })
})
