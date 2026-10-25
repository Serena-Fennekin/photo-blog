import type {
  Category,
  GalleryPhoto,
  PublicExif,
  PublicSettings,
  StoryDetail
} from '../../app/types/content'

export type FixtureStory = StoryDetail & {
  status: 'published' | 'draft'
}

export const fixtureCategories: Category[] = [
  { slug: 'portrait', name: '人像' },
  { slug: 'nature', name: '自然' }
]

const makeImage = (id: string, width: number, height: number, alt: string) => {
  const base = `https://images.unsplash.com/${id}?auto=format&fit=crop`
  return {
    src: `${base}&w=1280&q=82`,
    srcset: `${base}&w=640&q=78 640w, ${base}&w=1280&q=82 1280w, ${base}&w=1920&q=84 1920w`,
    width,
    height,
    alt
  }
}

const winterExif: PublicExif = {
  camera: 'FUJIFILM X-T5',
  lens: 'XF 35mm F1.4 R',
  focalLengthMm: 35,
  aperture: 2,
  shutter: '1/500',
  iso: 160,
  capturedAt: '2025-12-16T15:42:00+08:00'
}

const riverExif: PublicExif = {
  camera: 'SONY ILCE-7M4',
  lens: 'FE 50mm F1.8',
  focalLengthMm: 50,
  aperture: 2.8,
  shutter: '1/800',
  iso: 100,
  capturedAt: '2025-02-07T16:20:00+08:00'
}

const photo = (
  input: Omit<GalleryPhoto, 'image' | 'viewCount'> & {
    imageId: string
    width: number
    height: number
    alt: string
  }
): GalleryPhoto => ({
  id: input.id,
  storyId: input.storyId,
  storySlug: input.storySlug,
  storyTitle: input.storyTitle,
  caption: input.caption,
  image: makeImage(input.imageId, input.width, input.height, input.alt),
  exif: input.exif,
  viewCount: 0
})

const winterPhotos: GalleryPhoto[] = [
  photo({
    id: 'winter-1', storyId: 'story-winter', storySlug: 'winter-light', storyTitle: '冬日侧光',
    caption: '山风越过枯草。', imageId: 'photo-1519681393784-d120267933ba',
    width: 1600, height: 2000, alt: '冬日山坡上被侧光照亮的枯草', exif: winterExif
  }),
  photo({
    id: 'winter-2', storyId: 'story-winter', storySlug: 'winter-light', storyTitle: '冬日侧光',
    caption: '云层短暂地打开。', imageId: 'photo-1483347756197-71ef80e95f73',
    width: 2400, height: 1600, alt: '云层下安静延伸的山脊', exif: winterExif
  }),
  photo({
    id: 'winter-3', storyId: 'story-winter', storySlug: 'winter-light', storyTitle: '冬日侧光',
    caption: '雪线把远处留成一小段白。', imageId: 'photo-1500530855697-b586d89ba3ee',
    width: 1600, height: 2133, alt: '雪线与远山之间的冬日树林', exif: winterExif
  })
]

const riverPhotos: GalleryPhoto[] = [
  photo({
    id: 'river-1', storyId: 'story-river', storySlug: 'river-walk', storyTitle: '沿江散步',
    caption: '傍晚的人群从光里经过。', imageId: 'photo-1519501025264-65ba15a82390',
    width: 2400, height: 1600, alt: '傍晚城市河岸与远处行人', exif: riverExif
  }),
  photo({
    id: 'river-2', storyId: 'story-river', storySlug: 'river-walk', storyTitle: '沿江散步',
    caption: '水面留下最后一点橙色。', imageId: 'photo-1470252649378-9c29740c9fa8',
    width: 1600, height: 2000, alt: '落日映在河面形成橙色光带', exif: riverExif
  })
]

const draftPhoto = photo({
  id: 'draft-1', storyId: 'story-draft', storySlug: 'unfinished-notes', storyTitle: '未完成',
  imageId: 'photo-1493246507139-91e8fad9978e', width: 2400, height: 1600,
  alt: '尚未发布的山间照片', exif: winterExif
})

export const fixtureStories: FixtureStory[] = [
  {
    id: 'story-winter', slug: 'winter-light', title: '冬日侧光',
    note: '光从云后落下来，山坡忽然有了呼吸。', capturedOn: '2025-12-16', location: '杭州 · 临安',
    categories: [fixtureCategories[1]!], cover: winterPhotos[0]!, previewPhotos: winterPhotos.slice(0, 2),
    photos: winterPhotos, status: 'published'
  },
  {
    id: 'story-river', slug: 'river-walk', title: '沿江散步',
    note: '没有目的地，只是跟着傍晚慢慢向前。', capturedOn: '2025-02-07', location: '杭州 · 钱塘江',
    categories: [fixtureCategories[0]!], cover: riverPhotos[0]!, previewPhotos: riverPhotos,
    photos: riverPhotos, status: 'published'
  },
  {
    id: 'story-draft', slug: 'unfinished-notes', title: '未完成', capturedOn: '2026-01-03',
    categories: [fixtureCategories[1]!], cover: draftPhoto, previewPhotos: [draftPhoto], photos: [draftPhoto], status: 'draft'
  }
]

export const fixtureSettings: PublicSettings = {
  heroMode: 'manual',
  heroPhoto: winterPhotos[1]!,
  lastValidHeroPhoto: winterPhotos[0]!
}
