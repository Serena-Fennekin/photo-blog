import type { JournalStore } from '../db/journal-store'
import type { ContentRepository } from './content-repository'
import { paginatePhotos, findPhotoContext } from './photo-query'
export const createSqliteContentRepository = (store: JournalStore): ContentRepository => ({
  async listHomePhotos(limit) { return store.featuredPhotos(limit) },
  async listGallery(input) { return paginatePhotos(store.publicPhotos(), store.listCategories().filter(category => category.active).map(({ slug, name }) => ({ slug, name })), input) },
  async getPhotoContext(id) { return findPhotoContext(store.publicPhotos(), id) },
  async getPublicSettings() { return store.publicSettings() }
})
