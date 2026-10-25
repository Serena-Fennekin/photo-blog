import type { GalleryPhoto } from '~/types/content'

export const mergeGalleryItems = (current: GalleryPhoto[], incoming: GalleryPhoto[]): GalleryPhoto[] => {
  const seen = new Set(current.map(photo => photo.id))
  return [...current, ...incoming.filter(photo => !seen.has(photo.id))]
}

export const gridSrcset = (srcset: string): string => srcset
  .split(',')
  .map(candidate => candidate.trim())
  .filter(candidate => {
    const match = candidate.match(/\s(\d+)w$/)
    return !match || Number(match[1]) <= 1280
  })
  .join(', ')
