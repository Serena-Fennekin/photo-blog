import type { DatabaseSync } from 'node:sqlite'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { photoHash } from '../media/photo-identity'
import type { AdminPhoto } from '../../shared/types/admin'

const neutralText = (value: string) => value.replace(/\u676d\u5dde|hang[\s_-]*zhou/gi, '').replace(/^[\s·,，-]+|[\s·,，-]+$/g, '')
function cleanPhotoCopy(photo: any) {
  for (const key of ['title', 'location', 'caption', 'note']) if (typeof photo[key] === 'string') photo[key] = neutralText(photo[key])
  if (!photo.title) photo.title = '未命名照片'
  if (photo.image?.alt) photo.image.alt = neutralText(photo.image.alt) || '照片'
  if (Array.isArray(photo.categories)) for (const category of photo.categories) category.name = neutralText(category.name) || '未命名分类'
}

/** Additive upgrade: original files, EXIF, counters and publication dates remain intact. */
export function upgradePhotoMetadata(db: DatabaseSync, originals?: string) {
  const cleanCopy = !db.prepare("SELECT 1 FROM metadata WHERE key='everyday-copy-v1'").get()
  const updates: AdminPhoto[] = []
  for (const row of db.prepare('SELECT payload FROM photos').all() as { payload: string }[]) {
    const photo = JSON.parse(row.payload) as AdminPhoto
    if (cleanCopy) cleanPhotoCopy(photo)
    if (originals && !photo.contentHash && photo.status !== 'deleted' && photo.processingStatus === 'ready' && /^[a-f0-9-]{36}$/.test(photo.id) && photo.originalKey === photo.id + '.original') {
      try { photo.contentHash = photoHash(readFileSync(join(originals, photo.originalKey))) } catch { /* Missing originals must not make published derivatives unavailable. */ }
    }
    if (JSON.stringify(photo) !== row.payload) updates.push(photo)
  }
  if (!cleanCopy && !updates.length) return
  db.exec('BEGIN IMMEDIATE')
  try {
    for (const photo of updates) db.prepare('UPDATE photos SET payload=? WHERE id=?').run(JSON.stringify(photo), photo.id)
    if (cleanCopy) {
      for (const row of db.prepare('SELECT slug,payload FROM categories').all() as { slug: string; payload: string }[]) {
        const category = JSON.parse(row.payload); category.name = neutralText(category.name) || '未命名分类'
        db.prepare('UPDATE categories SET payload=? WHERE slug=?').run(JSON.stringify(category), row.slug)
      }
      const row = db.prepare('SELECT payload FROM settings WHERE id=1').get() as { payload: string }
      const settings = JSON.parse(row.payload)
      if (settings.lastValidHeroPhoto) cleanPhotoCopy(settings.lastValidHeroPhoto)
      db.prepare('UPDATE settings SET payload=? WHERE id=1').run(JSON.stringify(settings))
      db.prepare("INSERT INTO metadata VALUES('everyday-copy-v1','1')").run()
    }
    db.exec('COMMIT')
  } catch (error) { db.exec('ROLLBACK'); throw error }
}
