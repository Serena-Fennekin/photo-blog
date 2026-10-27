import { randomBytes } from 'node:crypto'
import { getJournalStore } from '../../../../db/journal-store'
import { limitRequests, requireSameOrigin } from '../../../../auth/request-policy'

export default defineEventHandler(event => {
  requireSameOrigin(event)
  limitRequests(event, 'views', 120)
  const id = getRouterParam(event, 'id') || ''
  let visitor = getCookie(event, 'journal_visitor')
  if (!visitor || !/^[a-f0-9]{64}$/.test(visitor)) {
    visitor = randomBytes(32).toString('hex')
    setCookie(event, 'journal_visitor', visitor, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 31536000, path: '/' })
  }
  try { return getJournalStore().recordView(id, visitor) } catch { throw createError({ statusCode: 404, statusMessage: '照片不存在' }) }
})
