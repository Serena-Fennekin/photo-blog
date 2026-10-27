import { createHash } from 'node:crypto'
import { createError, getHeader, getRequestIP, getRequestURL, type H3Event } from 'h3'

const buckets = new Map<string, { count: number; expires: number }>()
export function limitRequests(event: H3Event, group: string, max: number, windowMs = 60000) {
  const now = Date.now()
  if (buckets.size > 10000) for (const [key, value] of buckets) if (value.expires <= now) buckets.delete(key)
  const key = createHash('sha256').update(`${group}:${getRequestIP(event) ?? 'unknown'}`).digest('hex')
  let bucket = buckets.get(key)
  if (!bucket || bucket.expires <= now) { bucket = { count: 0, expires: now + windowMs }; buckets.set(key, bucket) }
  if (++bucket.count > max) throw createError({ statusCode: 429, statusMessage: '请求过于频繁，请稍后重试' })
}
export function requireSameOrigin(event: H3Event) {
  const origin = getHeader(event, 'origin')
  if (getHeader(event, 'sec-fetch-site') === 'cross-site') throw createError({ statusCode: 403, statusMessage: '拒绝跨站请求' })
  if (origin) {
    try { if (new URL(origin).host === getRequestURL(event).host) return } catch { /* malformed origin is rejected below */ }
    throw createError({ statusCode: 403, statusMessage: '拒绝跨站请求' })
  }
}
export function localSetupAllowed(event: H3Event) {
  const host = getRequestURL(event).hostname
  const ip = getRequestIP(event)
  return process.env.NODE_ENV !== 'production' && ['localhost', '127.0.0.1', '[::1]'].includes(host) && (!ip || ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(ip))
}
