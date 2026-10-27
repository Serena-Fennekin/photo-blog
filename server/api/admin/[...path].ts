import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { z, ZodError } from 'zod'
import { getJournalStore } from '../../db/journal-store'
import { hashPassword, verifyPassword } from '../../auth/password'
import { createSessionToken, revokeSession } from '../../auth/session'
import { limitRequests, localSetupAllowed } from '../../auth/request-policy'
import { mediaRoot, processLocalPhoto } from '../../media/local-media-provider'

let processing = false
const loginSchema = z.object({ username: z.string().trim().min(1).max(60), password: z.string().min(1).max(128) })
export default defineEventHandler(async event => {
  const path = (getRouterParam(event, 'path') || '').split('/').filter(Boolean)
  const method = event.method, store = getJournalStore()
  setHeader(event, 'Cache-Control', 'no-store')
  try {
    if (path[0] === 'auth') {
      const initialized = Boolean(store.db.prepare('SELECT id FROM admins LIMIT 1').get())
      if (path[1] === 'state' && method === 'GET') return { initialized, canSetup: !initialized && localSetupAllowed(event) }
      if (['login', 'setup'].includes(path[1] || '') && method === 'POST') {
        limitRequests(event, 'login', 10, 15 * 60000)
        const { username, password } = loginSchema.parse(await readBody(event))
        if (path[1] === 'setup') {
          if (initialized || !localSetupAllowed(event)) throw createError({ statusCode: 403, statusMessage: '管理员初始化已关闭' })
          const encoded = await hashPassword(password)
          store.transaction(() => {
            if (store.db.prepare('SELECT id FROM admins LIMIT 1').get()) throw createError({ statusCode: 409, statusMessage: '管理员已创建' })
            store.db.prepare('INSERT INTO admins VALUES(?,?,?)').run(randomUUID(), username, encoded)
          })
        }
        const admin = store.db.prepare('SELECT * FROM admins WHERE username=?').get(username) as { id: string; username: string; password_hash: string } | undefined
        if (!admin || !await verifyPassword(admin.password_hash, password)) throw createError({ statusCode: 401, statusMessage: '用户名或密码错误' })
        revokeSession(store, getCookie(event, 'journal_admin'))
        setCookie(event, 'journal_admin', createSessionToken(store, admin.id), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 7 * 86400, path: '/' })
        return { username: admin.username }
      }
      if (path[1] === 'me' && method === 'GET') return event.context.admin
      if (path[1] === 'logout' && method === 'POST') { revokeSession(store, getCookie(event, 'journal_admin')); deleteCookie(event, 'journal_admin', { path: '/' }); return { ok: true } }
    }
    if (path[0] === 'photos') {
      const id = path[1]
      if (!id && method === 'GET') return store.listPhotos()
      if (id === 'bulk' && method === 'POST') {
        const body = z.object({ ids: z.array(z.string()).min(1).max(1000), changes: z.record(z.string(), z.unknown()) }).strict().parse(await readBody(event))
        return store.updatePhotos(body.ids, body.changes)
      }
      if (id === 'order' && method === 'PUT') {
        const body = z.object({ ids: z.array(z.string()).max(100000) }).strict().parse(await readBody(event))
        return store.reorderPhotos(body.ids)
      }
      if (id && path.length === 2) {
        const photo = store.getPhoto(id)
        if (!photo || photo.status === 'deleted') throw createError({ statusCode: 404 })
        if (method === 'GET') return photo
        if (method === 'PATCH') return store.updatePhoto(id, await readBody(event))
        if (method === 'DELETE') return store.updatePhoto(id, { status: 'deleted' })
      }
      if (method === 'POST' && (!id || (path.length === 3 && path[2] === 'retry'))) {
        limitRequests(event, 'upload', 100)
        const existing = id ? store.getPhoto(id) : null
        if (id && (!existing || existing.status === 'deleted')) throw createError({ statusCode: 404 })
        if (processing) throw createError({ statusCode: 429, statusMessage: '正在处理上一张照片，请稍后重试' })
        processing = true
        const photoId = id || randomUUID()
        let filename = 'photo.jpg'
        try {
          let data: Buffer
          if (existing) {
            if (existing.originalKey !== photoId + '.original') throw new Error('没有可重试的原始文件，请重新选择照片')
            data = await readFile(join(mediaRoot(), 'private', existing.originalKey))
            filename = existing.image?.alt || filename
          } else {
            if (Number(getHeader(event, 'content-length')) > 25 * 1024 * 1024) throw createError({ statusCode: 413, statusMessage: '照片最大25MB' })
            const chunks: Buffer[] = []; let size = 0
            for await (const chunk of event.node.req) {
              const part = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
              size += part.length
              if (size > 25 * 1024 * 1024) throw createError({ statusCode: 413, statusMessage: '照片最大25MB' })
              chunks.push(part)
            }
            data = Buffer.concat(chunks)
            filename = decodeURIComponent(getHeader(event, 'x-file-name') || filename).slice(0, 300)
          }
          const asset = await processLocalPhoto(data, photoId, filename)
          return existing ? store.replaceAsset(photoId, asset) : store.createPhoto(asset)
        } catch (error) {
          if (!existing && !(error && typeof error === 'object' && 'statusCode' in error)) {
            const failed = store.createPhoto({ id: photoId, processingStatus: 'failed', originalKey: photoId + '.original', exif: {}, error: '图片处理失败，请重试或重新选择JPEG、PNG、WebP照片' })
            store.updatePhoto(failed.id, { title: filename.replace(/\.[^.]+$/, '').slice(0, 120) })
          }
          throw error
        } finally { processing = false }
      }
    }
    if (path[0] === 'categories') {
      if (method === 'GET') return store.listCategories()
      if (method === 'PUT') return store.saveCategory(await readBody(event))
    }
    if (path[0] === 'settings') {
      if (method === 'GET') return { ...store.getSettings(), photos: store.publicPhotos() }
      if (method === 'PUT') return store.updateSettings(await readBody(event))
    }
    throw createError({ statusCode: 404, statusMessage: '接口不存在' })
  } catch (error) {
    if (error instanceof ZodError) throw createError({ statusCode: 400, statusMessage: '填写内容格式不正确', data: error.flatten() })
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    const message = error instanceof Error ? error.message : '操作失败'
    throw createError({ statusCode: 400, statusMessage: message.includes('UNIQUE') ? '照片或分类已存在' : message.slice(0, 180) })
  }
})
