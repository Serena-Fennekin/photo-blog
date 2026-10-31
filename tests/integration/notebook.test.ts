import { afterEach, describe, expect, it } from 'vitest'
import { DatabaseSync } from 'node:sqlite'
import { NotebookStore } from '../../server/db/notebook-store'
import { defaultSiteCopy } from '../../shared/notebook'

const databases: DatabaseSync[] = []
const setup = () => { const db = new DatabaseSync(':memory:'); databases.push(db); return new NotebookStore(db) }
afterEach(() => databases.splice(0).forEach(db => db.close()))
const draft = { title: '', body: '一段日常', topic: 'life', imageIds: [], status: 'draft', visibility: 'public' }
const asset = (id: string) => ({ id, processingStatus: 'ready' as const, exif: {}, originalKey: id + '.original', image: { src: `/media/${id}/1280.webp`, srcset: '', width: 100, height: 100, alt: '配图' } })

describe('notebook copy and independent posts', () => {
  it('persists the selected author identity without accepting unsafe avatar sources', () => {
    const store = setup()
    const avatar = 'data:image/webp;base64,UklGRgAAAABXRUJQ'
    store.saveCopy({ authorName: '路上的人', authorAvatar: avatar })
    expect(new NotebookStore(store.db).getCopy()).toMatchObject({ authorName: '路上的人', authorAvatar: avatar })
    expect(() => store.saveCopy({ authorAvatar: 'javascript:alert(1)' })).toThrow()
    expect(() => store.saveCopy({ authorAvatar: 'data:image/svg+xml,<svg/>' })).toThrow()
  })
  it('persists custom topics, deduplicates labels and exposes their labels only with public posts', () => {
    const store = setup()
    const topic = store.addTopic({ label: '  路边观察  ' })
    expect(store.addTopic({ label: '路边观察' }).id).toBe(topic.id)
    expect(store.addTopic({ label: '生活片刻' }).id).toBe('life')
    expect(new NotebookStore(store.db).listTopics()[topic.id]).toBe('路边观察')
    const visible = store.savePost(null, { ...draft, topic: topic.id, status: 'published' })
    expect(store.publicPost(visible.id)).toMatchObject({ topic: topic.id, topicLabel: '路边观察' })
    expect(() => store.savePost(null, { ...draft, topic: 'unknown-topic' })).toThrow()
    expect(() => store.addTopic({ label: ' ' })).toThrow()
  })
  it('uses existing copy as defaults, persists edits, and rejects blank or unexpected fields', () => {
    const store = setup()
    expect(store.getCopy()).toEqual(defaultSiteCopy)
    expect(store.saveCopy({ homeQuote: '第一行\n第二行', authorName: '作者' }).homeQuote).toBe('第一行\n第二行')
    expect(new NotebookStore(store.db).getCopy().authorName).toBe('作者')
    expect(() => store.saveCopy({ homeQuote: '' })).toThrow()
    expect(() => store.saveCopy({ administrator: 'secret' })).toThrow()
  })
  it('exposes only published public posts and projects no private fields or original keys', () => {
    const store = setup()
    store.savePost(null, draft)
    const hidden = store.savePost(null, { ...draft, status: 'published', visibility: 'private', body: '仅我可见' })
    const visible = store.savePost(null, { ...draft, status: 'published', body: '大家能看见' })
    expect(store.listPublicPosts().items.map(post => post.id)).toEqual([visible.id])
    expect(store.publicPost(hidden.id)).toBeNull()
    expect(store.listAdminPosts()).toHaveLength(3)
    expect(store.listPublicPosts().items[0]).not.toHaveProperty('visibility')
    store.savePost(visible.id, { ...draft, status: 'published', visibility: 'private' })
    expect(store.publicPost(visible.id)).toBeNull()
  })
  it('enforces media association and revokes access when a post or image is removed', () => {
    const store = setup()
    store.addAsset(asset('11111111-1111-4111-8111-111111111111'))
    const id = '11111111-1111-4111-8111-111111111111'
    expect(store.isPublicAsset(id)).toBe(false)
    const post = store.savePost(null, { ...draft, imageIds: [id], status: 'published' })
    expect(store.isPublicAsset(id)).toBe(true)
    expect(JSON.stringify(store.publicPost(post.id))).not.toContain('originalKey')
    expect(() => store.savePost(null, { ...draft, imageIds: [id] })).toThrow()
    expect(() => store.savePost(post.id, { ...draft, imageIds: ['missing'] })).toThrow()
    expect(store.isPublicAsset(id)).toBe(true)
    store.savePost(post.id, { ...draft, status: 'published', imageIds: [], body: '改为纯文字' })
    expect(store.isPublicAsset(id)).toBe(false)
    store.savePost(post.id, { ...draft, status: 'published', imageIds: [id] })
    store.deletePost(post.id)
    expect(store.isPublicAsset(id)).toBe(false)
    expect(store.listPublicPosts().items).toEqual([])
  })
  it('paginates stably without repeating tied dates or including private posts', () => {
    const store = setup()
    for (let i = 0; i < 6; i++) store.savePost(null, { ...draft, status: 'published', body: String(i) })
    const first = store.listPublicPosts(undefined, 2)
    const second = store.listPublicPosts(first.nextCursor!, 2)
    const third = store.listPublicPosts(second.nextCursor!, 2)
    expect(new Set([...first.items, ...second.items, ...third.items].map(post => post.id)).size).toBe(6)
    expect(third.nextCursor).toBeNull()
    expect(() => store.listPublicPosts('not-a-valid-cursor')).toThrow()
  })
  it('counts one visible public visit per visitor/post/day and rejects nonpublic visits', () => {
    const store = setup()
    const post = store.savePost(null, { ...draft, status: 'published' })
    expect(store.recordView(post.id, 'visitor', 1000)).toEqual({ total: 1, counted: true })
    expect(store.recordView(post.id, 'visitor', 2000)).toEqual({ total: 1, counted: false })
    expect(store.recordView(post.id, 'another', 2000).total).toBe(2)
    expect(store.recordView(post.id, 'visitor', 86401001).total).toBe(3)
    store.savePost(post.id, { ...draft, status: 'published', visibility: 'private' })
    expect(() => store.recordView(post.id, 'stranger')).toThrow()
    expect(store.getPost(post.id)?.viewCount).toBe(3)
  })
  it('rejects empty content, excess images and bad visibility and does not rewrite photo tables', () => {
    const store = setup()
    expect(() => store.savePost(null, { ...draft, body: '' })).toThrow()
    expect(() => store.savePost(null, { ...draft, imageIds: Array(10).fill('a') })).toThrow()
    expect(() => store.savePost(null, { ...draft, visibility: 'friends' })).toThrow()
    expect(store.db.prepare("SELECT name FROM sqlite_master WHERE name='photos'").get()).toBeUndefined()
  })
})
