import {ABOUT_CRANK_CYCLE_MS,ABOUT_RIDE_MS} from './route-motion-timing'
export type Point = { x: number; y: number }
export function legPose(hip: Point, pedal: Point) {
  const ankle = { x: pedal.x + 7, y: pedal.y - 8 }
  const dx = ankle.x - hip.x, dy = ankle.y - hip.y
  const distance = Math.hypot(dx, dy), thigh = 64, calf = 74
  const along = (thigh * thigh - calf * calf + distance * distance) / (2 * distance)
  const bend = Math.sqrt(Math.max(0, thigh * thigh - along * along))
  return { hip, ankle, pedal, knee: { x: hip.x + dx * along / distance - dy * bend / distance, y: hip.y + dy * along / distance + dx * bend / distance } }
}
export function cyclingFrame(width: number, spriteWidth: number, elapsed: number) {
  const travel = Math.min(1, Math.max(0, elapsed / ABOUT_RIDE_MS))
  const start = width + spriteWidth * .42 + 24, end = -spriteWidth * .58 - 24
  const seam = start + (end - start) * travel
  const angle = -elapsed / ABOUT_CRANK_CYCLE_MS * 2 * Math.PI
  return { travel, seam, x: seam - spriteWidth * .42, angle, fold: Math.min(width * .14, 180) * Math.sin(Math.PI * travel), finished: travel >= 1, near: { x: 232 + 26 * Math.cos(angle), y: 176 + 26 * Math.sin(angle) }, far: { x: 232 - 26 * Math.cos(angle), y: 176 - 26 * Math.sin(angle) } }
}
