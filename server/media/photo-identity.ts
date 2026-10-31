import { createHash } from 'node:crypto'
import type { AdminPhoto } from '../../shared/types/admin'

export const photoHash = (input: Buffer) => createHash('sha256').update(input).digest('hex')

export class DuplicatePhotoError extends Error {
  readonly statusCode = 409
  readonly existingPhoto: Pick<AdminPhoto, 'id' | 'title' | 'status'>
  constructor(photo: AdminPhoto, message = '这张照片已经上传，已跳过重复文件') {
    super(message)
    this.existingPhoto = { id: photo.id, title: photo.title, status: photo.status }
  }
}
