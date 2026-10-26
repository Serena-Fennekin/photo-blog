import { getContentRepository } from '../../../repositories'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 400, statusMessage: '缺少摄影记录地址' })

  const story = await getContentRepository().getStoryBySlug(slug)
  if (!story) throw createError({ statusCode: 404, statusMessage: '这组摄影记录不存在' })
  return story
})
