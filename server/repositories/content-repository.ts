import type {
  GalleryPage,
  PhotoContext,
  PublicSettings,
  StoryDetail,
  StorySummary
} from '../../app/types/content'

export type GalleryQuery = {
  category?: string
  cursor?: string
  limit: number
}

export interface ContentRepository {
  listHomeStories(limit: number): Promise<StorySummary[]>
  listGallery(input: GalleryQuery): Promise<GalleryPage>
  getStoryBySlug(slug: string): Promise<StoryDetail | null>
  getPhotoContext(photoId: string): Promise<PhotoContext | null>
  getPublicSettings(): Promise<PublicSettings>
}
