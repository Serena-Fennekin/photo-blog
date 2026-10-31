import { parseGalleryQuery, GalleryQueryError } from '../../../shared/schemas/public-query'
import { getContentRepository } from '../../repositories'

export default defineEventHandler(async (event) => {
  try {
    const query = parseGalleryQuery(getQuery(event))
    return await getContentRepository().listGallery(query)
  } catch (error) {
    if (error instanceof GalleryQueryError) {
      throw createError({ statusCode: 400, statusMessage: error.message })
    }
    throw error
  }
})
