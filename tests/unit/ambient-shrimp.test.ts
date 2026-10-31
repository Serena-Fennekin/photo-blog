import {describe,expect,it} from 'vitest'
import {shrimpPose,shrimpRig} from '../../app/utils/ambient-shrimp'
describe('shrimp motion',()=>{
  it('stays underwater and on the canvas for mobile and wide layouts',()=>{
    for(const [width,height] of [[393,852],[2560,1440],[3840,2160]])for(let index=0;index<3;index++)for(let time=0;time<900000;time+=1379){
      const pose=shrimpPose(time,index,width!,height!)
      expect(Object.values(pose).every(Number.isFinite)).toBe(true)
      expect(pose.x).toBeGreaterThan(width!*.08)
      expect(pose.x).toBeLessThan(width!*.92)
      expect(pose.y).toBeGreaterThan(height!*.08)
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
  it('keeps all leg and cheliped segments connected with fixed lengths throughout a gait',()=>{
    const length=(a:{x:number;y:number},b:{x:number;y:number})=>Math.hypot(a.x-b.x,a.y-b.y)
    for(let time=0;time<10000;time+=127){
      const rig=shrimpRig(time,1)
      expect(rig.legs).toHaveLength(8)
      expect(rig.claws).toHaveLength(2)
      for(const leg of rig.legs){expect(length(leg.root,leg.joint)).toBeCloseTo(13,5);expect(length(leg.joint,leg.tip)).toBeCloseTo(17,5)}
      for(const claw of rig.claws){expect(length(claw.root,claw.joint)).toBeCloseTo(30,5);expect(length(claw.joint,claw.tip)).toBeCloseTo(34,5);expect(claw.tip.x).toBeGreaterThan(45)}
    }
  })
  it('alternates contralateral feet and moves the joints without discontinuities',()=>{
    const a=shrimpRig(100,0),b=shrimpRig(116,0)
    expect(a.legs[0]!.tip.x-a.legs[0]!.root.x).not.toBeCloseTo(a.legs[1]!.tip.x-a.legs[1]!.root.x)
    for(let i=0;i<a.legs.length;i++){
      expect(Math.hypot(a.legs[i]!.tip.x-b.legs[i]!.tip.x,a.legs[i]!.tip.y-b.legs[i]!.tip.y)).toBeLessThan(1)
      expect(Math.hypot(a.legs[i]!.joint.x-b.legs[i]!.joint.x,a.legs[i]!.joint.y-b.legs[i]!.joint.y)).toBeLessThan(1)
    }
  })
})
