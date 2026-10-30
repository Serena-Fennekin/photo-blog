import {describe,expect,it} from 'vitest'
import {pondSwimmers} from '../../app/utils/pond-swimmers'

describe('shared pond trajectories',()=>{
  it.each([[719,720],[720,719]])('keeps retained creatures in place across a%ipx→%ipx density change',(before,after)=>{
    for(const time of [0,30000,120000,400000]){
      const a=pondSwimmers(time,before,852),b=pondSwimmers(time,after,852)
      for(const next of b){
        const previous=a.find(pose=>pose.kind===next.kind&&pose.index===next.index)
        if(!previous)continue
        expect(Math.hypot(next.x-previous.x,next.y-previous.y)).toBeLessThan(3)
        expect(Math.abs(Math.atan2(Math.sin(next.angle-previous.angle),Math.cos(next.angle-previous.angle)))).toBeLessThan(.02)
      }
    }
  })
  it.each([[393,852,4],[844,393,6],[2560,1440,6]])('spreads %ipx water creatures through the full pond without piling up',(width,height,count)=>{
    const ranges=Array.from({length:count!},()=>({min:Infinity,max:-Infinity}))
    for(let time=0;time<480000;time+=2111){
      const poses=pondSwimmers(time,width!,height!)
      expect(poses).toHaveLength(count!)
      for(let i=0;i<poses.length;i++){
        const p=poses[i]!,r=ranges[i]!
        expect([p.x,p.y,p.angle].every(Number.isFinite)).toBe(true)
        expect(p.x).toBeGreaterThan(0);expect(p.x).toBeLessThan(width!)
        expect(p.y).toBeGreaterThan(0);expect(p.y).toBeLessThan(height!)
        r.min=Math.min(r.min,p.y/height!);r.max=Math.max(r.max,p.y/height!)
        for(let j=0;j<i;j++)expect(Math.hypot(p.x-poses[j]!.x,p.y-poses[j]!.y)).toBeGreaterThan((p.radius+poses[j]!.radius)*.92)
      }
    }
    for(const range of ranges){expect(range.min).toBeLessThan(.34);expect(range.max).toBeGreaterThan(.70)}
  })
  it('moves continuously through separation and turns, without frame-to-frame jumps',()=>{
    for(let time=0;time<240000;time+=419){
      const a=pondSwimmers(time,2560,1440),b=pondSwimmers(time+16,2560,1440)
      for(let i=0;i<a.length;i++){
        expect(Math.hypot(a[i]!.x-b[i]!.x,a[i]!.y-b[i]!.y)).toBeLessThan(4)
        expect(Math.abs(Math.atan2(Math.sin(a[i]!.angle-b[i]!.angle),Math.cos(a[i]!.angle-b[i]!.angle)))).toBeLessThan(.08)
      }
    }
  })
})
