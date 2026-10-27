import type { Category, GalleryPhoto } from '../../app/types/content'
import type { GalleryQuery } from './content-repository'
export function paginatePhotos(photos: GalleryPhoto[], categories: Category[], input: GalleryQuery) {
  const eligible = photos.filter(photo => !input.category || photo.categories.some(category => category.slug === input.category))
  const index = input.cursor ? eligible.findIndex(photo => photo.id === input.cursor) : -1
  const items = input.cursor && index === -1 ? [] : eligible.slice(index + 1, index + 1 + Math.max(0, input.limit))
  return { items, nextCursor: index + 1 + items.length < eligible.length ? items.at(-1)?.id ?? null : null, categories }
}
export function findPhotoContext(photos: GalleryPhoto[], id: string) {
  const index = photos.findIndex(photo => photo.id === id)
  return index < 0 ? null : { photo: photos[index]!, siblings: photos, index }
}
