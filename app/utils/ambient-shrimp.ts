/** Closed, slow underwater paths with a nonzero tangent at each turn. */
export function shrimpPose(time:number,index:number,width:number,height:number) {
  const speed=.000037+index*.000003,t=time*speed+index*2.3
  const x=width*(.5+.34*Math.cos(t))
  const y=height*(.74+.115*Math.sin(t)+.022*Math.sin(2*t+index))
  const dx=-width*.34*Math.sin(t),dy=height*(.115*Math.cos(t)+.044*Math.cos(2*t+index))
  return {x,y,angle:Math.atan2(dy,dx),stroke:Math.sin(time*.0038+index*1.7)}
}

export function createShrimpSprite() {
  const canvas=document.createElement('canvas');canvas.width=144;canvas.height=96
  const ctx=canvas.getContext('2d')!
  ctx.translate(68,43)
  const shell=ctx.createLinearGradient(-15,-14,9,16)
  shell.addColorStop(0,'rgba(205,226,207,.88)');shell.addColorStop(.4,'rgba(155,184,169,.64)');shell.addColorStop(1,'rgba(94,143,133,.65)')
  ctx.beginPath();ctx.moveTo(23,-8);ctx.bezierCurveTo(9,-20,-12,-14,-24,-3);ctx.bezierCurveTo(-33,6,-27,20,-17,22);ctx.quadraticCurveTo(-9,23,-5,15);ctx.bezierCurveTo(-25,20,-28,6,-14,3);ctx.quadraticCurveTo(7,-6,23,-2);ctx.closePath()
  ctx.fillStyle=shell;ctx.fill();ctx.strokeStyle='rgba(75,122,112,.7)';ctx.lineWidth=.9;ctx.stroke()
  ctx.save();ctx.clip();ctx.strokeStyle='rgba(236,246,226,.85)';ctx.lineWidth=1.1
  for(const [x,y,angle] of [[8,-10,.1],[-3,-8,-.15],[-13,-4,-.4],[-21,2,-.75],[-23,10,-1.1]]){
    ctx.save();ctx.translate(x!,y!);ctx.rotate(angle!);ctx.beginPath();ctx.moveTo(-3,-9);ctx.quadraticCurveTo(3,0,2,10);ctx.stroke();ctx.restore()
  }
  ctx.strokeStyle='rgba(65,117,105,.45)';ctx.lineWidth=.65;ctx.beginPath();ctx.moveTo(20,-6);ctx.bezierCurveTo(-9,-12,-25,-1,-22,12);ctx.stroke();ctx.restore()
  // Fan-like uropods, a pointed rostrum and stalked eyes distinguish it from a fish.
  ctx.fillStyle='rgba(125,171,148,.7)';ctx.strokeStyle='rgba(71,121,108,.55)';ctx.lineWidth=.7
  for(const angle of [-.6,0,.6]){ctx.save();ctx.translate(-8,17);ctx.rotate(angle);ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(6,0,12,10);ctx.quadraticCurveTo(1,13,0,0);ctx.fill();ctx.stroke();ctx.restore()}
  ctx.beginPath();ctx.moveTo(18,-10);ctx.lineTo(37,-10);ctx.lineTo(25,-4);ctx.closePath();ctx.fill();ctx.stroke()
  for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(23+i*3,-10);ctx.lineTo(24+i*3,-13);ctx.stroke()}
  ctx.strokeStyle='#729487';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(18,-11);ctx.lineTo(20,-15);ctx.moveTo(23,-6);ctx.lineTo(27,-8);ctx.stroke()
  ctx.fillStyle='#385e54';for(const [x,y] of [[20,-15],[27,-8]]){ctx.beginPath();ctx.arc(x!,y!,1.7,0,Math.PI*2);ctx.fill()}
  return canvas
}

export function drawShrimp(ctx:CanvasRenderingContext2D,sprite:HTMLCanvasElement,time:number,index:number,width:number,height:number) {
  const pose=shrimpPose(time,index,width,height),scale=width<720?.62:width>1800?1.1:.9
  ctx.save();ctx.translate(pose.x,pose.y);ctx.rotate(pose.angle);ctx.scale(scale,scale)
  ctx.globalAlpha=pose.x>width*.22&&pose.x<width*.78&&pose.y<height*.72?.3:.57
  // Thin articulated walking legs and antennae are drawn around a cached shell.
  ctx.strokeStyle='rgba(79,130,119,.8)';ctx.lineWidth=.75
  for(let i=0;i<5;i++)for(const side of [-1,1]){
    const phase=Math.sin(time*.0038+i*.85+index)*2.8
    ctx.beginPath();ctx.moveTo(10-i*5,3);ctx.quadraticCurveTo(3-i*5+phase,side*9,10-i*5+phase,side*17);ctx.stroke()
  }
  ctx.drawImage(sprite,-68,-43)
  ctx.strokeStyle='rgba(81,134,124,.65)';ctx.lineWidth=.65
  for(const side of [-1,1]){
    ctx.beginPath();ctx.moveTo(25,-7);ctx.bezierCurveTo(43,side*10,49,side*25+pose.stroke*3,65,side*29+pose.stroke*3);ctx.stroke()
    ctx.beginPath();ctx.moveTo(25,-4);ctx.quadraticCurveTo(48,side*10,55,side*15+pose.stroke*2);ctx.stroke()
  }
  ctx.restore()
}
