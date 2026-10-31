import type { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { randomUUID } from 'node:crypto'
import type { AdminPhoto } from '../../shared/types/admin'

/** The only legacy-content boundary. No group relationship survives migration. */
export function migrateFlatPhotos(db: DatabaseSync, path: string) {
  const columns = db.prepare('PRAGMA table_info(photos)').all()
  if (!columns.some(column => column.name === 'story_id')) return
  if (path !== ':memory:') {
    const directory = join(dirname(path), 'backups')
    mkdirSync(directory, { recursive: true })
    const backup = join(directory, 'before-flat-photos-' + new Date().toISOString().replaceAll(':', '-') + '-' + randomUUID().slice(0, 8) + '.sqlite')
    db.prepare('VACUUM INTO ?').run(backup)
  }
  db.exec('BEGIN IMMEDIATE')
  try {
    const rows = db.prepare('SELECT p.id,p.story_id AS owner_id,p.position,p.payload AS asset,s.payload AS owner FROM photos p LEFT JOIN stories s ON s.id=p.story_id').all() as { id: string; owner_id: string; position: number; asset: string; owner: string | null }[]
    const parsed = rows.map(row => ({ ...row, assetData: JSON.parse(row.asset), ownerData: row.owner ? JSON.parse(row.owner) : {} }))
    const visibleOwners = new Set(parsed.filter(row => row.ownerData.status === 'published' && row.ownerData.coverPhotoId === row.id && row.assetData.status === 'ready' && row.assetData.image).map(row => row.owner_id))
    const photos = parsed.map(row => {
      const old = row.assetData, owner = row.ownerData
      const processingStatus = old.status === 'failed' ? 'failed' : 'ready'
      const status = ['draft', 'published', 'deleted'].includes(owner.status) ? owner.status : 'draft'
      const photo: AdminPhoto = {
        id: row.id, processingStatus, status: status === 'published' && (!visibleOwners.has(row.owner_id) || processingStatus === 'failed') ? 'draft' : status,
        title: old.title ?? owner.title ?? '', caption: old.caption ?? '', note: old.note ?? owner.note ?? '',
        capturedOn: old.capturedOn ?? owner.capturedOn ?? '1970-01-01', location: old.location ?? owner.location ?? '',
        categorySlugs: old.categorySlugs ?? owner.categorySlugs ?? [], position: row.position,
        updatedAt: owner.updatedAt ?? new Date().toISOString(),
        ...(status === 'published' ? { publishedAt: owner.publishedAt ?? owner.updatedAt ?? new Date().toISOString() } : {}),
        exif: old.exif ?? {}, ...(old.image ? { image: old.image } : {}),
        ...(old.originalKey ? { originalKey: old.originalKey } : {}), ...(old.error ? { error: old.error } : {})
      }
      return photo
    }).sort((a, b) => b.capturedOn.localeCompare(a.capturedOn) || (b.publishedAt ?? b.updatedAt).localeCompare(a.publishedAt ?? a.updatedAt) || a.position - b.position || a.id.localeCompare(b.id))
    db.exec('ALTER TABLE photos RENAME TO legacy_group_photos; CREATE TABLE photos(id TEXT PRIMARY KEY,position INTEGER NOT NULL,payload TEXT NOT NULL);')
    const insert = db.prepare('INSERT INTO photos VALUES(?,?,?)')
    photos.forEach((photo, position) => insert.run(photo.id, position, JSON.stringify({ ...photo, position })))
    db.exec('DROP TABLE legacy_group_photos; DROP TABLE stories;')
    const settingsRow = db.prepare('SELECT payload FROM settings WHERE id=1').get() as { payload: string } | undefined
    if (settingsRow) db.prepare('UPDATE settings SET payload=? WHERE id=1').run(JSON.stringify({ ...JSON.parse(settingsRow.payload), lastValidHeroPhoto: null }))
    db.exec('COMMIT')
  } catch (error) { db.exec('ROLLBACK'); throw error }
}
