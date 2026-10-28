import type { DatabaseSync } from 'node:sqlite'
import { createHash, randomUUID } from 'node:crypto'
import { z } from 'zod'
import { defaultSiteCopy } from '../../shared/notebook'
import type { AdminPost, PostPage, PublicPost, SiteCopy } from '../../shared/types/notebook'
import type { PhotoAsset } from '../../shared/types/admin'

const text = (max: number) => z.string().trim().max(max)
const copySchema = z.object({ homeQuote: text(400).min(1), homeLinkLabel: text(24).min(1), aboutTitle: text(40).min(1), aboutStatement: text(200), aboutBody: text(4000), authorName: text(40).min(1), authorTagline: text(160) }).partial().strict()
const postSchema = z.object({ title: text(120), body: text(10000), topic: z.enum(['life', 'photography', 'cycling', 'gear']), imageIds: z.array(z.string().uuid()).max(9).refine(ids => new Set(ids).size === ids.length), status: z.enum(['draft', 'published']), visibility: z.enum(['public', 'private']) }).strict().refine(post => Boolean(post.body || post.imageIds.length), { message: '请填写正文或添加图片' })
type PostRow = { payload: string; total?: number }

export class NotebookStore {
  constructor(readonly db: DatabaseSync) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS site_copy(id INTEGER PRIMARY KEY CHECK(id=1),payload TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS posts(id TEXT PRIMARY KEY,status TEXT NOT NULL,visibility TEXT NOT NULL,published_at TEXT NOT NULL,payload TEXT NOT NULL);
      CREATE INDEX IF NOT EXISTS posts_public_feed ON posts(status,visibility,published_at DESC,id DESC);
      CREATE TABLE IF NOT EXISTS post_assets(id TEXT PRIMARY KEY,post_id TEXT,payload TEXT NOT NULL);
      CREATE INDEX IF NOT EXISTS post_assets_parent ON post_assets(post_id);
      CREATE TABLE IF NOT EXISTS post_view_totals(post_id TEXT PRIMARY KEY,total INTEGER NOT NULL DEFAULT 0);
      CREATE TABLE IF NOT EXISTS post_view_dedup(key TEXT PRIMARY KEY,expires_at INTEGER NOT NULL);
      CREATE INDEX IF NOT EXISTS post_view_expiry ON post_view_dedup(expires_at);
    `)
  }
  private transaction<T>(action: () => T): T {
    this.db.exec('BEGIN IMMEDIATE')
    try { const value = action(); this.db.exec('COMMIT'); return value } catch (error) { this.db.exec('ROLLBACK'); throw error }
  }
  getCopy(): SiteCopy {
    const row = this.db.prepare('SELECT payload FROM site_copy WHERE id=1').get() as { payload: string } | undefined
    return { ...defaultSiteCopy, ...(row ? JSON.parse(row.payload) : {}) }
  }
  saveCopy(input: unknown): SiteCopy {
    const change = copySchema.parse(input)
    return this.transaction(() => {
      const copy = { ...this.getCopy(), ...change }
      this.db.prepare('INSERT INTO site_copy VALUES(1,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload').run(JSON.stringify(copy))
      return copy
    })
  }
  addAsset(asset: PhotoAsset) {
    if (asset.processingStatus !== 'ready' || !asset.image) throw new Error('图片尚未处理完成')
    this.db.prepare('INSERT INTO post_assets(id,payload) VALUES(?,?)').run(asset.id, JSON.stringify(asset))
    return { id: asset.id, image: asset.image }
  }
  getAsset(id: string): (PhotoAsset & { postId: string | null }) | null {
    const row = this.db.prepare('SELECT payload,post_id FROM post_assets WHERE id=?').get(id) as { payload: string; post_id: string | null } | undefined
    return row ? { ...JSON.parse(row.payload), postId: row.post_id } : null
  }
  isPublicAsset(id: string): boolean {
    return Boolean(this.db.prepare("SELECT 1 FROM post_assets a JOIN posts p ON p.id=a.post_id WHERE a.id=? AND p.status='published' AND p.visibility='public'").get(id))
  }
  private readPost(row: PostRow): AdminPost {
    const post = JSON.parse(row.payload) as AdminPost
    post.images = post.imageIds.map(id => this.getAsset(id)).filter((asset): asset is NonNullable<typeof asset> => Boolean(asset?.image)).map(asset => ({ id: asset.id, image: asset.image! }))
    post.viewCount = Number(row.total ?? 0)
    return post
  }
  getPost(id: string): AdminPost | null {
    const row = this.db.prepare('SELECT p.payload,coalesce(v.total,0) AS total FROM posts p LEFT JOIN post_view_totals v ON v.post_id=p.id WHERE p.id=? AND p.status!=\'deleted\'').get(id) as PostRow | undefined
    return row ? this.readPost(row) : null
  }
  listAdminPosts(): AdminPost[] {
    return (this.db.prepare("SELECT p.payload,coalesce(v.total,0) AS total FROM posts p LEFT JOIN post_view_totals v ON v.post_id=p.id WHERE p.status!='deleted' ORDER BY json_extract(p.payload,'$.createdAt') DESC,p.id DESC").all() as PostRow[]).map(row => this.readPost(row))
  }
  savePost(id: string | null, input: unknown): AdminPost {
    const change = postSchema.parse(input)
    return this.transaction(() => {
      const existing = id ? this.getPost(id) : null
      if (id && !existing) throw new Error('动态不存在')
      const key = id || randomUUID(), now = new Date().toISOString()
      for (const assetId of change.imageIds) {
        const asset = this.getAsset(assetId)
        if (!asset || !asset.image || (asset.postId && asset.postId !== key)) throw new Error('图片不存在或已用于另一条动态')
      }
      const post: AdminPost = { ...change, id: key, createdAt: existing?.createdAt ?? now, updatedAt: now, publishedAt: existing?.publishedAt || (change.status === 'published' ? now : ''), images: [], viewCount: existing?.viewCount ?? 0 }
      this.db.prepare('INSERT INTO posts VALUES(?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET status=excluded.status,visibility=excluded.visibility,published_at=excluded.published_at,payload=excluded.payload').run(key, post.status, post.visibility, post.publishedAt, JSON.stringify(post))
      this.db.prepare('UPDATE post_assets SET post_id=NULL WHERE post_id=?').run(key)
      for (const assetId of change.imageIds) this.db.prepare('UPDATE post_assets SET post_id=? WHERE id=?').run(key, assetId)
      return this.getPost(key)!
    })
  }
  deletePost(id: string) {
    if (!this.getPost(id)) throw new Error('动态不存在')
    this.db.prepare("UPDATE posts SET status='deleted' WHERE id=?").run(id)
    return { ok: true }
  }
  private project(post: AdminPost): PublicPost {
    const { id, title, body, topic, images, publishedAt, updatedAt, viewCount } = post
    return { id, title, body, topic, images, publishedAt, updatedAt, viewCount }
  }
  publicPost(id: string): PublicPost | null {
    const post = this.getPost(id)
    return post?.status === 'published' && post.visibility === 'public' ? this.project(post) : null
  }
  listPublicPosts(cursor?: string, limit = 10): PostPage {
    const size = z.number().int().min(1).max(20).parse(limit)
    let date = '', id = ''
    if (cursor) {
      if (cursor.length > 250) throw new Error('分页参数无效')
      try { [date, id] = z.tuple([z.string().datetime(), z.string().uuid()]).parse(JSON.parse(Buffer.from(cursor, 'base64url').toString())) } catch { throw new Error('分页参数无效') }
    }
    const rows = this.db.prepare("SELECT p.payload,coalesce(v.total,0) AS total FROM posts p LEFT JOIN post_view_totals v ON v.post_id=p.id WHERE p.status='published' AND p.visibility='public' AND (?='' OR p.published_at<? OR (p.published_at=? AND p.id<?)) ORDER BY p.published_at DESC,p.id DESC LIMIT ?").all(date, date, date, id, size + 1) as PostRow[]
    const items = rows.slice(0, size).map(row => this.project(this.readPost(row)))
    const last = items.at(-1)
    return { items, nextCursor: rows.length > size && last ? Buffer.from(JSON.stringify([last.publishedAt, last.id])).toString('base64url') : null }
  }
  recordView(id: string, visitor: string, now = Date.now()) {
    return this.transaction(() => {
      const post = this.publicPost(id)
      if (!post) throw new Error('动态不存在')
      const key = createHash('sha256').update(visitor + ':' + id).digest('hex')
      this.db.prepare('DELETE FROM post_view_dedup WHERE expires_at<=?').run(now)
      const counted = Boolean(this.db.prepare('INSERT OR IGNORE INTO post_view_dedup VALUES(?,?)').run(key, now + 86400000).changes)
      if (counted) this.db.prepare('INSERT INTO post_view_totals VALUES(?,1) ON CONFLICT(post_id) DO UPDATE SET total=total+1').run(id)
      return { total: this.getPost(id)!.viewCount, counted }
    })
  }
}
