import sharp from 'sharp'
export async function createProfileAvatar(data: Buffer) {
  if (data.length > 5 * 1024 * 1024) throw new Error('头像图片最大5MB')
  const image = sharp(data, { limitInputPixels: 40_000_000, animated: false })
  const metadata = await image.metadata()
  if (!['jpeg','png','webp'].includes(metadata.format || '')) throw new Error('请选择JPEG、PNG或WebP头像')
  const output = await image.rotate().resize(192,192,{fit:'cover'}).webp({quality:80}).toBuffer()
  return 'data:image/webp;base64,' + output.toString('base64')
}
export async function normalizeProfileAvatar(value: unknown) {
  if (value === '') return ''
  if (typeof value !== 'string' || value.length > 65536 || !/^data:image\/webp;base64,[A-Za-z0-9+/]+={0,2}$/.test(value)) throw new Error('头像格式不正确，请重新上传')
  const data=Buffer.from(value.split(',')[1]!, 'base64')
  const metadata=await sharp(data,{limitInputPixels:40_000_000,animated:false}).metadata()
  if(metadata.format==='webp'&&metadata.width===192&&metadata.height===192&&(!metadata.pages||metadata.pages===1)&&!metadata.exif&&!metadata.icc&&!metadata.xmp&&!metadata.iptc) return value
  return createProfileAvatar(data)
}
