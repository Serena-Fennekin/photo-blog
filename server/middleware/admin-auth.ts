import { defineEventHandler, createError, getCookie } from 'h3'
import { getJournalStore } from '../db/journal-store'
import { findSession } from '../auth/session'
import { requireSameOrigin } from '../auth/request-policy'

export default defineEventHandler(event => {
  const path = event.path.split('?')[0]!
  if (!path.startsWith('/api/admin/')) return
  if (!['GET', 'HEAD', 'OPTIONS'].includes(event.method)) requireSameOrigin(event)
  if (['/api/admin/auth/state', '/api/admin/auth/login', '/api/admin/auth/setup'].includes(path)) return
  const admin = findSession(getJournalStore(), getCookie(event, 'journal_admin'))
  if (!admin) throw createError({ statusCode: 401, statusMessage: '请重新登录' })
  event.context.admin = admin
})
