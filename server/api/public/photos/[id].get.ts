import { getContentRepository } from '../../../repositories'

export default defineEventHandler(async (event) => {
  const photoId = getRouterParam(event, 'id')
  if (!photoId) throw createError({ statusCode: 400, statusMessage: '缺少照片 ID' })

  const context = await getContentRepository().getPhotoContext(photoId)
  if (!context) throw createError({ statusCode: 404, statusMessage: '照片不存在' })
  return context
})
