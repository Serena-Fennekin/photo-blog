import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
const root = resolve(process.env.JOURNAL_DATA_DIR || 'data')
const destination = resolve(root, 'backups', `journal-${new Date().toISOString().replace(/[:.]/g, '-')}.sqlite`)
mkdirSync(resolve(root, 'backups'), { recursive: true })
const db = new DatabaseSync(resolve(root, 'journal.sqlite'), { open: true })
try { db.prepare('VACUUM INTO ?').run(destination); console.log(`一致性备份已保存：${destination}`) } finally { db.close() }
