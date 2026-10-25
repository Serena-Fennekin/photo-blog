import type { GalleryPhoto, StoryDetail, StorySummary } from '../../app/types/content'
import { fixtureCategories, fixtureSettings, fixtureStories } from '../fixtures/content'
import type { ContentRepository, GalleryQuery } from './content-repository'

const publishedStories = (): StoryDetail[] => fixtureStories
  .filter(story => story.status === 'published')
  .sort((left, right) => right.capturedOn.localeCompare(left.capturedOn))
  .map(({ status: _status, ...story }) => story)

const allPublishedPhotos = (): GalleryPhoto[] => publishedStories().flatMap(story => story.photos)

const clone = <T>(value: T): T => structuredClone(value)

export const createFixtureContentRepository = (): ContentRepository => ({
  async listHomeStories(limit: number): Promise<StorySummary[]> {
    return clone(publishedStories().slice(0, Math.max(0, limit)).map(({ photos: _photos, ...story }) => story))
  },

  async listGallery(input: GalleryQuery) {
    const eligibleStoryIds = input.category
      ? new Set(publishedStories()
          .filter(story => story.categories.some(category => category.slug === input.category))
          .map(story => story.id))
      : null
    const photos = allPublishedPhotos().filter(photo => !eligibleStoryIds || eligibleStoryIds.has(photo.storyId))
    const cursorIndex = input.cursor ? photos.findIndex(photo => photo.id === input.cursor) : -1
    if (input.cursor && cursorIndex === -1) {
      return { items: [], nextCursor: null, categories: clone(fixtureCategories) }
    }
    const start = cursorIndex + 1
    const items = photos.slice(start, start + Math.max(0, input.limit))
    const hasNext = start + items.length < photos.length
    return {
      items: clone(items),
      nextCursor: hasNext ? items.at(-1)?.id ?? null : null,
      categories: clone(fixtureCategories)
    }
  },

  async getStoryBySlug(slug: string) {
    const story = publishedStories().find(candidate => candidate.slug === slug)
    return story ? clone(story) : null
  },

  async getPhotoContext(photoId: string) {
    const story = publishedStories().find(candidate => candidate.photos.some(photo => photo.id === photoId))
    if (!story) return null
    const index = story.photos.findIndex(photo => photo.id === photoId)
    return clone({ photo: story.photos[index]!, siblings: story.photos, index })
  },

  async getPublicSettings() {
    return clone(fixtureSettings)
  }
})
