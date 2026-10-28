import { randomBytes } from 'node:crypto'
import { getCookie, setCookie, setHeader, type H3Event } from 'h3'
export function getVisitor(event: H3Event): string {
  const existing = getCookie(event, 'journal_visitor')
  if (existing && /^[a-f0-9]{64}$/.test(existing)) return existing
  const visitor = randomBytes(32).toString('hex')
  setCookie(event, 'journal_visitor', visitor, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 31536000, path: '/' })
  setHeader(event, 'Cache-Control', 'private, no-store')
  return visitor
}
