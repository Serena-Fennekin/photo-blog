import { describe, expect, it } from 'vitest'

import { GalleryQueryError, parseGalleryQuery } from '../../shared/schemas/public-query'

describe('parseGalleryQuery', () => {
  it('uses a 24 item default and accepts a category slug', () => {
    expect(parseGalleryQuery({ category: 'nature' })).toEqual({ category: 'nature', limit: 24 })
  })

  it('caps an explicit page size at 48 items', () => {
    expect(parseGalleryQuery({ limit: '99' })).toEqual({ limit: 48 })
  })

  it('rejects a malformed cursor', () => {
    expect(() => parseGalleryQuery({ cursor: '../../private' })).toThrow(GalleryQueryError)
  })

  it('rejects array query values instead of silently picking one', () => {
    expect(() => parseGalleryQuery({ category: ['nature', 'portrait'] })).toThrow(GalleryQueryError)
  })
})
