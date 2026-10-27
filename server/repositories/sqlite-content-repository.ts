import type { JournalStore } from '../db/journal-store'
import type { ContentRepository } from './content-repository'

export const createSqliteContentRepository = (store: JournalStore): ContentRepository => ({
  async listHomeStories(limit) { return store.publicStories().slice(0, limit).map(({ photos: _photos, ...story }) => story) },
  async listGallery({ category, cursor, limit }) {
    const photos = store.publicStories().filter(story => !category || story.categories.some(item => item.slug === category)).flatMap(story => story.photos)
    const index = cursor ? photos.findIndex(photo => photo.id === cursor) : -1
    const items = cursor && index === -1 ? [] : photos.slice(index + 1, index + 1 + limit)
    return { items, nextCursor: index + 1 + items.length < photos.length ? items.at(-1)?.id ?? null : null, categories: store.listCategories().filter(category => category.active).map(({ slug, name }) => ({ slug, name })) }
  },
  async getStoryBySlug(slug) { return store.publicStories().find(story => story.slug === slug) ?? null },
  async getPhotoContext(photoId) {
    const story = store.publicStories().find(story => story.photos.some(photo => photo.id === photoId))
    if (!story) return null
    const index = story.photos.findIndex(photo => photo.id === photoId)
    return { photo: story.photos[index]!, siblings: story.photos, index }
  },
  async getPublicSettings() { return store.publicSettings() }
})
