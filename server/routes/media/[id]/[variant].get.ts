import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { join } from 'node:path'
import { mediaRoot } from '../../../media/local-media-provider'
import { getJournalStore } from '../../../db/journal-store'
import { findSession } from '../../../auth/session'

export default defineEventHandler(async event => {
  const id = getRouterParam(event, 'id') || '', variant = getRouterParam(event, 'variant') || ''
  if (!/^[a-f0-9-]{36}$/.test(id) || !/^(640|1280|1920)\.webp$/.test(variant)) throw createError({ statusCode: 404 })
  const store = getJournalStore()
  const isPublic = store.publicStories().some(story => story.photos.some(photo => photo.id === id))
  if (!isPublic && !findSession(store, getCookie(event, 'journal_admin'))) throw createError({ statusCode: 404 })
  const path = join(mediaRoot(), 'public', id, variant)
  try { await stat(path) } catch { throw createError({ statusCode: 404 }) }
  setHeader(event, 'Content-Type', 'image/webp')
  setHeader(event, 'X-Content-Type-Options', 'nosniff')
  setHeader(event, 'Cache-Control', isPublic ? 'public, max-age=60' : 'private, no-store')
  return sendStream(event, createReadStream(path))
})
