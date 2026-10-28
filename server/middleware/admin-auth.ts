import { defineEventHandler, createError, getCookie, setHeader } from 'h3'
import { getJournalStore } from '../db/journal-store'
import { findSession } from '../auth/session'
import { requireSameOrigin } from '../auth/request-policy'

export default defineEventHandler(event => {
  const path = event.path.split('?')[0]!
  if (path === '/admin' || path.startsWith('/admin/')) {
    setHeader(event, 'Cache-Control', 'private, no-store')
    setHeader(event, 'Vary', 'Cookie')
    return
  }
  if (!path.startsWith('/api/admin/')) return
  if (!['GET', 'HEAD', 'OPTIONS'].includes(event.method)) requireSameOrigin(event)
  if (['/api/admin/auth/state', '/api/admin/auth/login', '/api/admin/auth/setup'].includes(path)) return
  const admin = findSession(getJournalStore(), getCookie(event, 'journal_admin'))
  if (!admin) throw createError({ statusCode: 401, statusMessage: '请重新登录' })
  event.context.admin = admin
})
