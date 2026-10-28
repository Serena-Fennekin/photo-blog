import { getVisitor } from '../../../../auth/visitor'
import { getJournalStore } from '../../../../db/journal-store'
import { limitRequests, requireSameOrigin } from '../../../../auth/request-policy'

export default defineEventHandler(event => {
  requireSameOrigin(event)
  limitRequests(event, 'views', 120)
  const id = getRouterParam(event, 'id') || ''
  const visitor = getVisitor(event)
  try { return getJournalStore().recordView(id, visitor) } catch { throw createError({ statusCode: 404, statusMessage: '照片不存在' }) }
})
