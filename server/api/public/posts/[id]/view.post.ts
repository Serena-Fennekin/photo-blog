import { getVisitor } from '../../../../auth/visitor'
import { getNotebookStore } from '../../../../utils/notebook'
import { limitRequests, requireSameOrigin } from '../../../../auth/request-policy'
export default defineEventHandler(event => {
  requireSameOrigin(event); limitRequests(event, 'post-views', 120)
  setHeader(event, 'Cache-Control', 'no-store')
  const visitor = getVisitor(event)
  try { return getNotebookStore().recordView(getRouterParam(event, 'id') || '', visitor) } catch { throw createError({ statusCode: 404, statusMessage: '动态不存在' }) }
})
