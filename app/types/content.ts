export type PublicExif = {
  camera?: string
  lens?: string
  focalLengthMm?: number
  aperture?: number
  shutter?: string
  iso?: number
  capturedAt?: string
}

export type PublicImage = {
  src: string
  srcset: string
  width: number
  height: number
  alt: string
}

export type Category = {
  slug: string
  name: string
}

export type GalleryPhoto = {
  id: string
  storyId: string
  storySlug: string
  storyTitle: string
  caption?: string
  image: PublicImage
  exif: PublicExif
  viewCount: number
}

export type StorySummary = {
  id: string
  slug: string
  title: string
  note?: string
  capturedOn: string
  location?: string
  categories: Category[]
  cover: GalleryPhoto
  previewPhotos: GalleryPhoto[]
}

export type StoryDetail = StorySummary & {
  photos: GalleryPhoto[]
}

export type PhotoContext = {
  photo: GalleryPhoto
  siblings: GalleryPhoto[]
  index: number
}

export type PublicSettings = {
  heroMode: 'manual' | 'latest'
  heroPhoto: GalleryPhoto | null
  lastValidHeroPhoto: GalleryPhoto | null
}

export type GalleryPage = {
  items: GalleryPhoto[]
  nextCursor: string | null
  categories: Category[]
}
