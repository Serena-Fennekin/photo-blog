import type { GalleryPage, GalleryPhoto, PhotoContext, PublicSettings } from '../../app/types/content'
export type GalleryQuery = { category?: string; cursor?: string; limit: number }
export interface ContentRepository {
  listHomePhotos(limit: number): Promise<GalleryPhoto[]>
  listGallery(input: GalleryQuery): Promise<GalleryPage>
  getPhotoContext(photoId: string): Promise<PhotoContext | null>
  getPublicSettings(): Promise<PublicSettings>
}
