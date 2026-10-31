import type { GalleryQuery } from '../../server/repositories/content-repository'

const SAFE_TOKEN = /^[a-z0-9][a-z0-9-]{0,63}$/

export class GalleryQueryError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'GalleryQueryError'
  }
}

const optionalToken = (value: unknown, label: string) => {
  if (value === undefined || value === '') return undefined
  if (typeof value !== 'string' || !SAFE_TOKEN.test(value)) {
    throw new GalleryQueryError(`${label} 参数无效`)
  }
  return value
}

export const parseGalleryQuery = (query: Record<string, unknown>): GalleryQuery => {
  const category = optionalToken(query.category, 'category')
  const cursor = optionalToken(query.cursor, 'cursor')
  const rawLimit = query.limit === undefined ? 24 : Number(query.limit)
  if (!Number.isInteger(rawLimit) || rawLimit < 1) {
    throw new GalleryQueryError('limit 参数无效')
  }

  return {
    ...(category ? { category } : {}),
    ...(cursor ? { cursor } : {}),
    limit: Math.min(rawLimit, 48)
  }
}
