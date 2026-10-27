import type { PublicExif } from '../../app/types/content'

export function sanitizeExif(input: Record<string, unknown> = {}): PublicExif {
  const result: PublicExif = {}
  const camera = [input.Make, input.Model].filter(value => typeof value === 'string').join(' ').trim()
  if (camera) result.camera = camera.slice(0, 160)
  if (typeof input.camera === 'string') result.camera = input.camera.slice(0, 160)
  const lens = input.LensModel ?? input.lens
  if (typeof lens === 'string') result.lens = lens.slice(0, 160)
  for (const [source, target] of [['FocalLength', 'focalLengthMm'], ['FNumber', 'aperture'], ['ISO', 'iso']] as const) {
    const value = input[source] ?? input[target]
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) result[target] = value
  }
  const exposure = input.ExposureTime
  if (typeof exposure === 'number' && exposure > 0) result.shutter = exposure < 1 ? `1/${Math.round(1 / exposure)}` : `${exposure}s`
  else if (typeof input.shutter === 'string') result.shutter = input.shutter.slice(0, 32)
  const date = input.DateTimeOriginal ?? input.capturedAt
  if (date instanceof Date && !Number.isNaN(date.getTime())) result.capturedAt = date.toISOString()
  else if (typeof date === 'string' && Number.isFinite(Date.parse(date))) result.capturedAt = date
  return result
}
