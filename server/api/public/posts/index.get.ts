import { getNotebookStore } from '../../../utils/notebook'
export default defineEventHandler(event => {
  setHeader(event, 'Cache-Control', 'no-store')
  const { cursor } = getQuery(event)
  if (cursor !== undefined && typeof cursor !== 'string') throw createError({ statusCode: 400, statusMessage: '分页参数无效' })
  try { return getNotebookStore().listPublicPosts(cursor) } catch { throw createError({ statusCode: 400, statusMessage: '分页参数无效' }) }
})
