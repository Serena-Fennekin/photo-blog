import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { randomUUID } from 'node:crypto'
import { createInterface } from 'node:readline'
import { Writable } from 'node:stream'
import { hash } from '@node-rs/argon2'

const username = process.argv[2]
if (!username || username.length > 60) { console.error('用法：npm run admin:create -- 用户名'); process.exit(1) }
if (!process.stdin.isTTY) { console.error('请在交互式终端中设置密码。'); process.exit(1) }
let muted = false
const output = new Writable({ write(chunk, encoding, callback) { if (!muted) process.stdout.write(chunk, encoding); callback() } })
const rl = createInterface({ input: process.stdin, output, terminal: true })
const answer = new Promise(resolve => rl.question('设置密码（至少12个字符，输入不回显）：', resolve))
muted = true
const password = await answer
muted = false; rl.close(); process.stdout.write('\n')
if (typeof password !== 'string' || password.length < 12 || password.length > 128) { console.error('密码需要12至128个字符'); process.exit(1) }
const root = resolve(process.env.JOURNAL_DATA_DIR || 'data'); mkdirSync(root, { recursive: true })
const db = new DatabaseSync(resolve(root, 'journal.sqlite'))
try {
  db.exec('PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS admins(id TEXT PRIMARY KEY,username TEXT NOT NULL UNIQUE,password_hash TEXT NOT NULL)')
  if (db.prepare('SELECT id FROM admins LIMIT 1').get()) throw new Error('管理员已存在。此命令不会覆盖已有账号。')
  const encoded = await hash(password, { algorithm: 2, memoryCost: 19456, timeCost: 2, parallelism: 1 })
  db.exec('BEGIN IMMEDIATE')
  try {
    if (db.prepare('SELECT id FROM admins LIMIT 1').get()) throw new Error('管理员已存在，初始化已关闭。')
    db.prepare('INSERT INTO admins VALUES(?,?,?)').run(randomUUID(), username, encoded)
    db.exec('COMMIT')
  } catch (error) { db.exec('ROLLBACK'); throw error }
  console.log('管理员已创建，请前往 /admin/login 登录。')
} finally { db.close() }
