import { afterEach, describe, expect, it } from 'vitest'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import sharp from 'sharp'
import { hashPassword, verifyPassword } from '../../server/auth/password'
import { createSessionToken, findSession, revokeSession } from '../../server/auth/session'
import { JournalStore } from '../../server/db/journal-store'
import { processLocalPhoto } from '../../server/media/local-media-provider'

const dirs: string[] = []
afterEach(async () => { for (const dir of dirs.splice(0)) await rm(dir, { recursive: true, force: true }) })

describe('administrator authentication', () => {
  it('hashes with Argon2id and rejects incorrect passwords', async () => {
    const hash = await hashPassword('Test-passphrase-123!')
    expect(hash).toMatch(/^\$argon2id\$/)
    expect(await verifyPassword(hash, 'Test-passphrase-123!')).toBe(true)
    expect(await verifyPassword(hash, 'wrong')).toBe(false)
    await expect(hashPassword('short')).rejects.toThrow()
  })
  it('stores only token hashes and rejects expired or revoked sessions', () => {
    const store = new JournalStore(':memory:', false)
    try {
      store.db.prepare('INSERT INTO admins VALUES(?,?,?)').run('admin', 'owner', 'hash')
      const token = createSessionToken(store, 'admin', 1000)
      expect(findSession(store, token, 1001)?.username).toBe('owner')
      expect(JSON.stringify(store.db.prepare('SELECT * FROM sessions').all())).not.toContain(token)
      expect(findSession(store, token, 1000 + 7 * 86400000)).toBeNull()
      revokeSession(store, token)
      expect(findSession(store, token, 1001)).toBeNull()
    } finally { store.db.close() }
  })
})

describe('local private originals and public derivatives', () => {
  it.each(['UTC', 'Asia/Shanghai'])('preserves original camera time and offset on a %s server', async (timezone) => {
    const previousTimezone = process.env.TZ
    process.env.TZ = timezone
    try {
      const directory = await mkdtemp(join(tmpdir(), 'journal-capture-time-')); dirs.push(directory)
      const input = await sharp({ create: { width: 60, height: 40, channels: 3, background: '#758577' } })
        .withExif({ IFD2: { DateTimeOriginal: '2026:08:19 12:37:12', OffsetTimeOriginal: '+08:00' } }).jpeg().toBuffer()
      const photo = await processLocalPhoto(input, randomUUID(), 'camera-time.jpg', directory)
      expect(photo.exif?.capturedAt).toBe('2026-08-19T12:37:12+08:00')
    } finally {
      if (previousTimezone === undefined) delete process.env.TZ
      else process.env.TZ = previousTimezone
    }
  })

  it('generates display variants without EXIF and keeps the original out of image URLs', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'photo-journal-media-')); dirs.push(directory)
    const input = await sharp({ create: { width: 900, height: 600, channels: 3, background: '#758577' } }).jpeg().toBuffer()
    const photo = await processLocalPhoto(input, randomUUID(), 'my-photo.jpg', directory)
    expect(photo.status).toBe('ready')
    expect(photo.image?.src).toMatch(/^\/media\/[a-f0-9-]+\/1280.webp$/)
    expect(photo.image?.src).not.toContain('private')
    const metadata = await sharp(await readFile(join(directory, 'public', photo.id, '1280.webp'))).metadata()
    expect(metadata.width).toBe(900)
    expect(metadata.exif).toBeUndefined()
    expect(photo.image?.srcset).toContain('640w')
  })
  it('rejects disguised and oversized files before exposing display URLs', async () => {
    await expect(processLocalPhoto(Buffer.from('<script>bad</script>'), randomUUID(), 'fake.jpg', tmpdir())).rejects.toThrow()
    await expect(processLocalPhoto(Buffer.alloc(25 * 1024 * 1024 + 1), randomUUID(), 'large.jpg', tmpdir())).rejects.toThrow()
  })
})
