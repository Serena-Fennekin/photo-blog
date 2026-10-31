import { hash, verify } from '@node-rs/argon2'

export async function hashPassword(password: string) {
  if (typeof password !== 'string' || password.length < 12 || password.length > 128) throw new Error('密码需要12至128个字符')
  return hash(password, { algorithm: 2, memoryCost: 19456, timeCost: 2, parallelism: 1 })
}
export const verifyPassword = async (encoded: string, password: string) => {
  if (typeof password !== 'string' || password.length > 128) return false
  try { return await verify(encoded, password) } catch { return false }
}
