import {describe,expect,it} from 'vitest'
import {shrimpPose} from '../../app/utils/ambient-shrimp'
describe('shrimp motion',()=>{
  it('stays underwater and on the canvas for mobile and wide layouts',()=>{
    for(const [width,height] of [[393,852],[2560,1440],[3840,2160]])for(let index=0;index<3;index++)for(let time=0;time<900000;time+=1379){
      const pose=shrimpPose(time,index,width!,height!)
      expect(Object.values(pose).every(Number.isFinite)).toBe(true)
      expect(pose.x).toBeGreaterThan(width!*.1)
      expect(pose.x).toBeLessThan(width!*.9)
      expect(pose.y).toBeGreaterThan(height!*.5)
      expect(pose.y).toBeLessThan(height!*.96)
    }
  })
  it('moves continuously through turns without jumping to the opposite screen edge',()=>{
    for(let time=0;time<240000;time+=71){
      const a=shrimpPose(time,1,2560,1440),b=shrimpPose(time+16,1,2560,1440)
      expect(Math.hypot(b.x-a.x,b.y-a.y)).toBeLessThan(2)
      expect(Math.abs(Math.atan2(Math.sin(b.angle-a.angle),Math.cos(b.angle-a.angle)))).toBeLessThan(.05)
    }
    const a=shrimpPose(0,0,2560,1440),b=shrimpPose(1000,0,2560,1440)
    expect(Math.hypot(b.x-a.x,b.y-a.y)).toBeGreaterThan(1)
  })
})
