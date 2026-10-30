import type { PublicImage } from '../../app/types/content'
export type SiteCopy = {
  homeQuote: string; homeLinkLabel: string; aboutTitle: string; aboutStatement: string
  aboutBody: string; authorName: string; authorTagline: string; authorAvatar: string
}
export type PostImage = { id: string; image: PublicImage }
export type PublicPost = { id: string; title: string; body: string; topic: string; topicLabel?: string; images: PostImage[]; publishedAt: string; updatedAt: string; viewCount: number }
export type AdminPost = PublicPost & { imageIds: string[]; status: 'draft' | 'published' | 'deleted'; visibility: 'public' | 'private'; createdAt: string }
export type PostPage = { items: PublicPost[]; nextCursor: string | null }
