import { randomBytes } from 'node:crypto'
import { getNotebookStore } from '../../../../utils/notebook'
import { limitRequests, requireSameOrigin } from '../../../../auth/request-policy'
export default defineEventHandler(event => {
  requireSameOrigin(event); limitRequests(event, 'post-views', 120)
  setHeader(event, 'Cache-Control', 'no-store')
  let visitor = getCookie(event, 'journal_visitor')
  if (!visitor || !/^[a-f0-9]{64}$/.test(visitor)) {
    visitor = randomBytes(32).toString('hex')
    setCookie(event, 'journal_visitor', visitor, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 31536000, path: '/' })
  }
  try { return getNotebookStore().recordView(getRouterParam(event, 'id') || '', visitor) } catch { throw createError({ statusCode: 404, statusMessage: '动态不存在' }) }
})
