import type { PublicExif, PublicImage } from '../../app/types/content'

export type AdminPhoto = { id: string; status: 'ready' | 'failed'; image?: PublicImage; exif: PublicExif; caption?: string; originalKey?: string; error?: string }
export type AdminStory = { id: string; slug: string; title: string; capturedOn: string; location: string; note: string; status: 'draft' | 'published' | 'deleted'; categorySlugs: string[]; coverPhotoId: string | null; photos: AdminPhoto[]; updatedAt: string; publishedAt?: string }
export type AdminCategory = { slug: string; name: string; active: boolean; position: number }
export type AdminSettings = { heroMode: 'manual' | 'latest'; heroPhotoId: string | null }
