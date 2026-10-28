import { getNotebookStore } from '../../../utils/notebook'
export default defineEventHandler(event => {
  setHeader(event, 'Cache-Control', 'no-store')
  const post = getNotebookStore().publicPost(getRouterParam(event, 'id') || '')
  if (!post) throw createError({ statusCode: 404, statusMessage: '动态不存在' })
  return post
})
