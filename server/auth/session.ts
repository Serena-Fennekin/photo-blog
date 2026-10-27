import { createHash, randomBytes } from 'node:crypto'
import type { JournalStore } from '../db/journal-store'

const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex')
export function createSessionToken(store: JournalStore, adminId: string, now = Date.now()): string {
  const token = randomBytes(32).toString('hex')
  store.db.prepare('DELETE FROM sessions WHERE expires_at<=?').run(now)
  store.db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(tokenHash(token), adminId, now + 7 * 86400000)
  return token
}
export function findSession(store: JournalStore, token: string | undefined, now = Date.now()): { id: string; username: string } | null {
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null
  return store.db.prepare('SELECT admins.id,admins.username FROM sessions JOIN admins ON admins.id=sessions.admin_id WHERE token_hash=? AND expires_at>?').get(tokenHash(token), now) as { id: string; username: string } | undefined ?? null
}
export function revokeSession(store: JournalStore, token?: string) {
  if (token) store.db.prepare('DELETE FROM sessions WHERE token_hash=?').run(tokenHash(token))
}
