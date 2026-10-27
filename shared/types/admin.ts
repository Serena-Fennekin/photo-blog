import type { PublicExif, PublicImage } from '../../app/types/content'

export type PhotoAsset = {
  id: string
  processingStatus: 'ready' | 'failed'
  image?: PublicImage
  exif: PublicExif
  originalKey?: string
  error?: string
}
export type AdminPhoto = PhotoAsset & {
  title: string
  capturedOn: string
  location: string
  note: string
  caption: string
  categorySlugs: string[]
  status: 'draft' | 'published' | 'deleted'
  position: number
  updatedAt: string
  publishedAt?: string
}
export type AdminCategory = { slug: string; name: string; active: boolean; position: number }
export type AdminSettings = { heroMode: 'manual' | 'latest'; heroPhotoId: string | null }
