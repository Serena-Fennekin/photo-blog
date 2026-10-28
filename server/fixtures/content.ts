import type { Category, GalleryPhoto, PublicSettings } from '../../app/types/content'

export const fixtureCategories: Category[] = [
  {
    "slug": "portrait",
    "name": "人像"
  },
  {
    "slug": "nature",
    "name": "自然"
  }
]

export const fixturePhotos: (GalleryPhoto & { status: 'published' | 'draft' })[] = [
  {
    "id": "winter-1",
    "caption": "山风越过枯草。",
    "image": {
      "src": "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1280&q=82",
      "srcset": "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=640&q=78 640w, https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1280&q=82 1280w, https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1920&q=84 1920w",
      "width": 1600,
      "height": 2000,
      "alt": "冬日山坡上被侧光照亮的枯草"
    },
    "exif": {
      "camera": "FUJIFILM X-T5",
      "lens": "XF 35mm F1.4 R",
      "focalLengthMm": 35,
      "aperture": 2,
      "shutter": "1/500",
      "iso": 160,
      "capturedAt": "2025-12-16T15:42:00+08:00"
    },
    "viewCount": 0,
    "title": "山风越过枯草。",
    "capturedOn": "2025-12-16",
    "location": "山路",
    "note": "光从云后落下来，山坡忽然有了呼吸。",
    "categories": [
      {
        "slug": "nature",
        "name": "自然"
      }
    ],
    "status": "published"
  },
  {
    "id": "winter-2",
    "caption": "云层短暂地打开。",
    "image": {
      "src": "https://images.unsplash.com/photo-1483347756197-71ef80e95f73?auto=format&fit=crop&w=1280&q=82",
      "srcset": "https://images.unsplash.com/photo-1483347756197-71ef80e95f73?auto=format&fit=crop&w=640&q=78 640w, https://images.unsplash.com/photo-1483347756197-71ef80e95f73?auto=format&fit=crop&w=1280&q=82 1280w, https://images.unsplash.com/photo-1483347756197-71ef80e95f73?auto=format&fit=crop&w=1920&q=84 1920w",
      "width": 2400,
      "height": 1600,
      "alt": "云层下安静延伸的山脊"
    },
    "exif": {
      "camera": "FUJIFILM X-T5",
      "lens": "XF 35mm F1.4 R",
      "focalLengthMm": 35,
      "aperture": 2,
      "shutter": "1/500",
      "iso": 160,
      "capturedAt": "2025-12-16T15:42:00+08:00"
    },
    "viewCount": 0,
    "title": "云层短暂地打开。",
    "capturedOn": "2025-12-16",
    "location": "山路",
    "note": "光从云后落下来，山坡忽然有了呼吸。",
    "categories": [
      {
        "slug": "nature",
        "name": "自然"
      }
    ],
    "status": "published"
  },
  {
    "id": "winter-3",
    "caption": "雪线把远处留成一小段白。",
    "image": {
      "src": "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1280&q=82",
      "srcset": "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=640&q=78 640w, https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1280&q=82 1280w, https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1920&q=84 1920w",
      "width": 1600,
      "height": 2133,
      "alt": "雪线与远山之间的冬日树林"
    },
    "exif": {
      "camera": "FUJIFILM X-T5",
      "lens": "XF 35mm F1.4 R",
      "focalLengthMm": 35,
      "aperture": 2,
      "shutter": "1/500",
      "iso": 160,
      "capturedAt": "2025-12-16T15:42:00+08:00"
    },
    "viewCount": 0,
    "title": "雪线把远处留成一小段白。",
    "capturedOn": "2025-12-16",
    "location": "山路",
    "note": "光从云后落下来，山坡忽然有了呼吸。",
    "categories": [
      {
        "slug": "nature",
        "name": "自然"
      }
    ],
    "status": "published"
  },
  {
    "id": "river-1",
    "caption": "傍晚的人群从光里经过。",
    "image": {
      "src": "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1280&q=82",
      "srcset": "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=640&q=78 640w, https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1280&q=82 1280w, https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1920&q=84 1920w",
      "width": 2400,
      "height": 1600,
      "alt": "傍晚城市河岸与远处行人"
    },
    "exif": {
      "camera": "SONY ILCE-7M4",
      "lens": "FE 50mm F1.8",
      "focalLengthMm": 50,
      "aperture": 2.8,
      "shutter": "1/800",
      "iso": 100,
      "capturedAt": "2025-02-07T16:20:00+08:00"
    },
    "viewCount": 0,
    "title": "傍晚的人群从光里经过。",
    "capturedOn": "2025-02-07",
    "location": "江边",
    "note": "没有目的地，只是跟着傍晚慢慢向前。",
    "categories": [
      {
        "slug": "portrait",
        "name": "人像"
      }
    ],
    "status": "published"
  },
  {
    "id": "river-2",
    "caption": "水面留下最后一点橙色。",
    "image": {
      "src": "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=1280&q=82",
      "srcset": "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=640&q=78 640w, https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=1280&q=82 1280w, https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=1920&q=84 1920w",
      "width": 1600,
      "height": 2000,
      "alt": "落日映在河面形成橙色光带"
    },
    "exif": {
      "camera": "SONY ILCE-7M4",
      "lens": "FE 50mm F1.8",
      "focalLengthMm": 50,
      "aperture": 2.8,
      "shutter": "1/800",
      "iso": 100,
      "capturedAt": "2025-02-07T16:20:00+08:00"
    },
    "viewCount": 0,
    "title": "水面留下最后一点橙色。",
    "capturedOn": "2025-02-07",
    "location": "江边",
    "note": "没有目的地，只是跟着傍晚慢慢向前。",
    "categories": [
      {
        "slug": "portrait",
        "name": "人像"
      }
    ],
    "status": "published"
  },
  {
    "id": "draft-1",
    "image": {
      "src": "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1280&q=82",
      "srcset": "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=640&q=78 640w, https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1280&q=82 1280w, https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1920&q=84 1920w",
      "width": 2400,
      "height": 1600,
      "alt": "尚未发布的山间照片"
    },
    "exif": {
      "camera": "FUJIFILM X-T5",
      "lens": "XF 35mm F1.4 R",
      "focalLengthMm": 35,
      "aperture": 2,
      "shutter": "1/500",
      "iso": 160,
      "capturedAt": "2025-12-16T15:42:00+08:00"
    },
    "viewCount": 0,
    "title": "未完成",
    "capturedOn": "2026-01-03",
    "location": "",
    "note": "",
    "categories": [
      {
        "slug": "nature",
        "name": "自然"
      }
    ],
    "status": "draft"
  }
]

const { status: _status, ...heroPhoto } = fixturePhotos[0]!
export const fixtureSettings: PublicSettings = { heroMode: 'manual', heroPhoto, lastValidHeroPhoto: heroPhoto }
