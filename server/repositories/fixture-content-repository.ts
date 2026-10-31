import { fixtureCategories, fixturePhotos, fixtureSettings } from '../fixtures/content'
import { paginatePhotos, findPhotoContext } from './photo-query'
import type { ContentRepository } from './content-repository'
const publishedPhotos = () => fixturePhotos.filter(photo => photo.status === 'published').map(({ status: _status, ...photo }) => structuredClone(photo))
export const createFixtureContentRepository = (): ContentRepository => ({
  async listHomePhotos(limit) { return publishedPhotos().slice(0, Math.max(0, Math.min(4, limit))) },
  async listGallery(input) { return paginatePhotos(publishedPhotos(), structuredClone(fixtureCategories), input) },
  async getPhotoContext(id) { return findPhotoContext(publishedPhotos(), id) },
  async getPublicSettings() { return structuredClone(fixtureSettings) }
})
