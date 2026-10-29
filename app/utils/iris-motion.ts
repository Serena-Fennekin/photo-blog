export const IRIS_DURATION = 1100
export function irisBufferSize(width: number, height: number, dpr = 1, pixels = 1500000, dimension = 4096) {
  const w = Math.max(1, width), h = Math.max(1, height)
  const ratio = Math.min(Math.max(1,dpr),1.25,Math.sqrt(pixels/(w*h)),dimension/w,dimension/h)
  return { width:Math.max(1,Math.floor(w*ratio)), height:Math.max(1,Math.floor(h*ratio)) }
}
export function irisPose(time: number) {
  const t = Math.max(0,Math.min(1,Number.isFinite(time)?time:0))
  const progress = t*t*t*(t*(t*6-15)+10), turn = progress*Math.PI/5
  const axes = new Float32Array(18)
  for(let i=0;i<9;i++) { const angle=i*Math.PI*2/9+turn; axes[i*2]=Math.cos(angle); axes[i*2+1]=Math.sin(angle) }
  return { axes, turn, shift:1.7*progress }
}
