import { expect, it } from 'vitest'
import sharp from 'sharp'
import { createProfileAvatar, normalizeProfileAvatar } from '../../server/media/profile-avatar'
it('keeps an already optimized avatar unchanged when other profile text is saved', async () => {
  const pixels=Buffer.from(Array.from({length:192*192*3},(_,i)=>(i*17+Math.floor(i/19)*13)%256))
  const image=await sharp(pixels,{raw:{width:192,height:192,channels:3}}).webp({quality:90}).toBuffer()
  const uri='data:image/webp;base64,'+image.toString('base64')
  expect(await normalizeProfileAvatar(uri)).toBe(uri)
})
it('turns an avatar into a bounded WebP without retaining source metadata', async () => {
  const source = await sharp({ create: { width: 600, height: 900, channels: 3, background: '#729082' } }).jpeg().withMetadata().toBuffer()
  const uri = await createProfileAvatar(source)
  expect(uri).toMatch(/^data:image\/webp;base64,/)
  const data = await sharp(Buffer.from(uri.split(',')[1]!, 'base64')).metadata()
  expect([data.width, data.height, data.format]).toEqual([192, 192, 'webp'])
  expect(data.exif).toBeUndefined()
  expect(uri.length).toBeLessThan(65536)
  expect(await normalizeProfileAvatar(uri)).toMatch(/^data:image\/webp;base64,/)
  await expect(normalizeProfileAvatar('data:image/svg+xml;base64,PHN2Zy8+')).rejects.toThrow()
  await expect(createProfileAvatar(Buffer.from('not an image'))).rejects.toThrow()
  await expect(createProfileAvatar(Buffer.alloc(5 * 1024 * 1024 + 1))).rejects.toThrow()
})
