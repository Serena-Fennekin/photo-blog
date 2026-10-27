import type { GalleryPhoto, PublicSettings } from '../../app/types/content'
import type { ContentRepository } from '../repositories/content-repository'
export type HomePageModel = { settings: PublicSettings; photos: GalleryPhoto[] }
export const getHomePageModel = async (repository: ContentRepository): Promise<HomePageModel> => {
  const [settings, photos] = await Promise.all([repository.getPublicSettings(), repository.listHomePhotos(12)])
  const heroPhoto = settings.heroPhoto ?? (settings.heroMode === 'latest' ? photos[0] : null) ?? settings.lastValidHeroPhoto
  return { settings: { ...settings, heroPhoto }, photos }
}
