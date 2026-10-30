export type PondSwimmer={kind:'koi'|'shrimp';index:number;x:number;y:number;angle:number;radius:number}
type Orbit={angles:number[];lengths:number[];total:number}
const orbits=new Map<string,Orbit>(),TAU=Math.PI*2

function point(angle:number,width:number,height:number){
  return {x:width*(.5+.34*Math.cos(angle)+.018*Math.sin(2*angle)),y:height*(.5+.34*Math.sin(angle)+.018*Math.cos(3*angle))}
}

function orbit(width:number,height:number){
  const key=width+':'+height,cached=orbits.get(key)
  if(cached)return cached
  const angles=[0],lengths=[0];let previous=point(0,width,height),total=0
  for(let i=1;i<=192;i++){
    const angle=i/192*TAU,next=point(angle,width,height)
    total+=Math.hypot(next.x-previous.x,next.y-previous.y)
    angles.push(angle);lengths.push(total);previous=next
  }
  const result={angles,lengths,total}
  // A resize cannot accumulate an unbounded collection of lookup tables.
  if(orbits.size>=4)orbits.delete(orbits.keys().next().value!)
  orbits.set(key,result);return result
}

/** Equal arc-length spacing keeps creatures apart even on shallow windows.
 * Gentle independent phase drift varies their pace without crossing or sudden
 * collision corrections; the middle remains quiet for the page's text. */
export function pondSwimmers(time:number,width:number,height:number):PondSwimmer[]{
  const track=orbit(width,height),count=width<720?4:6,result:PondSwimmer[]=[]
  for(let slot=0;slot<count;slot++){
    const progress=time*.0000062+slot/count+.012*Math.sin(time*.00011+slot*1.8)
    const distance=((progress%1+1)%1)*track.total
    let low=0,high=track.lengths.length-1
    while(high-low>1){const mid=(low+high)>>1;if(track.lengths[mid]!<distance)low=mid;else high=mid}
    const mix=(distance-track.lengths[low]!)/(track.lengths[high]!-track.lengths[low]!)
    const angle=track.angles[low]!+(track.angles[high]!-track.angles[low]!)*mix,p=point(angle,width,height)
    const dx=width*(-.34*Math.sin(angle)+.036*Math.cos(2*angle)),dy=height*(.34*Math.cos(angle)-.054*Math.sin(3*angle))
    const kind=slot%2?'shrimp':'koi',scale=kind==='shrimp'?(width<720?.62:width>1800?1.1:.9):(width<720?.7:width>1800?1.2:1)
    result.push({...p,kind,index:Math.floor(slot/2),angle:Math.atan2(dy,dx),radius:(kind==='shrimp'?82:49)*scale})
  }
  return result
}
