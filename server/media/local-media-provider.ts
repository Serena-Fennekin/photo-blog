import { mkdir, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import sharp from 'sharp'
import exifr from 'exifr'
import { sanitizeExif } from './exif-policy'
import type { AdminPhoto } from '../../shared/types/admin'

sharp.concurrency(1)
sharp.cache({ memory: 24, files: 10, items: 30 })
export const mediaRoot = () => resolve(process.env.JOURNAL_MEDIA_DIR || 'storage')
export async function processLocalPhoto(input: Buffer, id: string, filename: string, root = mediaRoot()): Promise<AdminPhoto> {
  if (!/^[a-f0-9-]{36}$/.test(id)) throw new Error('无效照片编号')
  if (!input.length || input.length > 25 * 1024 * 1024) throw new Error('每张照片最大25MB')
  const metadata = await sharp(input, { limitInputPixels: 50000000, animated: false }).metadata()
  if (!['jpeg', 'png', 'webp'].includes(metadata.format ?? '') || !metadata.width || !metadata.height) throw new Error('仅支持JPEG、PNG和WebP静态照片')
  if ((metadata.pages ?? 1) > 1) throw new Error('请上传静态照片')
  await mkdir(join(root, 'private'), { recursive: true })
  await writeFile(join(root, 'private', `${id}.original`), input)
  await mkdir(join(root, 'public', id), { recursive: true })
  const variants: string[] = []
  for (const width of [640, 1280, 1920]) {
    const { data, info } = await sharp(input, { limitInputPixels: 50000000 }).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 83 }).toBuffer({ resolveWithObject: true })
    await writeFile(join(root, 'public', id, `${width}.webp`), data)
    variants.push(`/media/${id}/${width}.webp ${info.width}w`)
  }
  const exif = await exifr.parse(input, { reviveValues: false, pick: ['Make', 'Model', 'LensModel', 'FocalLength', 'FNumber', 'ISO', 'ExposureTime', 'DateTimeOriginal', 'OffsetTimeOriginal', 'OffsetTime'] }).catch(() => null)
  const rotated = (metadata.orientation ?? 1) >= 5
  return { id, status: 'ready', originalKey: `${id}.original`, exif: sanitizeExif(exif ?? {}), caption: '', image: { src: `/media/${id}/1280.webp`, srcset: [...new Map(variants.map(value => [value.split(' ').at(-1), value])).values()].join(', '), width: rotated ? metadata.height : metadata.width, height: rotated ? metadata.width : metadata.height, alt: filename.replace(/\.[^.]+$/, '').slice(0, 300) } }
}
