import { irisBufferSize, irisPose } from './iris-motion'
export type IrisPalette = { tip:string; face:string; edge:string }
const light:IrisPalette = {tip:'#b5c7bf',face:'#dce5df',edge:'#bfcfc7'}
type Pose = ReturnType<typeof irisPose>
type Backend = { kind:'webgl'|'2d'; maxDimension:number; lost:()=>boolean; draw:(pose:Pose,palette:IrisPalette)=>void; clear:()=>void; dispose:()=>void }
const vertex = 'attribute vec2 a_position;void main(){gl_Position=vec4(a_position,0.,1.);}'
const fragment = `precision highp float;
uniform vec2 u_resolution;
uniform vec2 u_axes[9];
uniform float u_shift;
uniform vec3 u_tip,u_face,u_edge;
float field(vec2 p,vec2 axis){vec2 q=vec2(dot(p,axis),dot(p,vec2(-axis.y,axis.x)));return q.x-u_shift-.8*q.y*q.y;}
vec3 material(vec2 q){float t=clamp(dot(q+vec2(.1,.5),vec2(1.6,1.15))/3.8825,0.,1.);return t<.42?mix(u_tip,u_face,t/.42):mix(u_face,u_edge,(t-.42)/.58);}
void main(){
 vec2 p=(gl_FragCoord.xy-.5*u_resolution)*(2./max(u_resolution.x,u_resolution.y));p.y=-p.y;
 float previous=field(p,u_axes[8]),outer=-100.,seam=0.;vec3 color=u_tip;
 float aa=2.5/max(u_resolution.x,u_resolution.y);
 for(int i=0;i<9;i++){
   vec2 axis=u_axes[i];vec2 q=vec2(dot(p,axis)-u_shift,dot(p,vec2(-axis.y,axis.x)));
   float d=q.x-.8*q.y*q.y;outer=max(outer,d);
   if(d>=0.&&previous<0.){color=material(q);seam=1.-smoothstep(aa*.3,aa*1.5,abs(previous));}
   previous=d;
 }
 float alpha=u_shift<.000001?1.:smoothstep(-aa,aa,outer);
 gl_FragColor=vec4(mix(color,color*.75,seam*.22),alpha);
}`
const rgb = (hex:string) => [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255)

function gpu(canvas:HTMLCanvasElement):Backend|undefined {
  const gl=canvas.getContext('webgl',{alpha:true,antialias:false,depth:false,stencil:false,premultipliedAlpha:false})
  if(!gl) return
  const shaders:WebGLShader[]=[], program=gl.createProgram(), buffer=gl.createBuffer()
  let lost=false
  const onLost=(event:Event)=>{ event.preventDefault();lost=true }
  const release=()=>{
    canvas.removeEventListener('webglcontextlost',onLost)
    gl.deleteBuffer(buffer);gl.deleteProgram(program);shaders.forEach(shader=>gl.deleteShader(shader))
    gl.getExtension('WEBGL_lose_context')?.loseContext()
  }
  try {
    if(!program||!buffer) throw new Error('Iris GPU resources unavailable')
    for(const [type,source] of [[gl.VERTEX_SHADER,vertex],[gl.FRAGMENT_SHADER,fragment]] as const){
      const shader=gl.createShader(type);if(!shader)throw new Error('Iris shader unavailable')
      shaders.push(shader);gl.shaderSource(shader,source);gl.compileShader(shader)
      if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)) throw new Error('Iris shader compilation failed')
      gl.attachShader(program,shader)
    }
    gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('Iris program unavailable')
    gl.useProgram(program);gl.bindBuffer(gl.ARRAY_BUFFER,buffer)
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW)
    const attribute=gl.getAttribLocation(program,'a_position')
    gl.enableVertexAttribArray(attribute);gl.vertexAttribPointer(attribute,2,gl.FLOAT,false,0,0)
    const uniforms=Object.fromEntries(['u_resolution','u_axes[0]','u_shift','u_tip','u_face','u_edge'].map(name=>[name,gl.getUniformLocation(program,name)]))
    const limits=gl.getParameter(gl.MAX_VIEWPORT_DIMS) as Int32Array
    canvas.addEventListener('webglcontextlost',onLost)
    return {kind:'webgl',maxDimension:Math.min(4096,limits[0]!,limits[1]!,gl.getParameter(gl.MAX_RENDERBUFFER_SIZE)),lost:()=>lost,
      draw(pose,palette){
        if(lost)return
        gl.viewport(0,0,canvas.width,canvas.height);gl.useProgram(program)
        gl.uniform2f(uniforms.u_resolution!,canvas.width,canvas.height);gl.uniform2fv(uniforms['u_axes[0]']!,pose.axes);gl.uniform1f(uniforms.u_shift!,pose.shift)
        gl.uniform3fv(uniforms.u_tip!,rgb(palette.tip));gl.uniform3fv(uniforms.u_face!,rgb(palette.face));gl.uniform3fv(uniforms.u_edge!,rgb(palette.edge))
        gl.drawArrays(gl.TRIANGLES,0,3)
      },
      clear(){if(!lost){gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT)}},dispose:release}
  }catch{release();return}
}

function cpu(canvas:HTMLCanvasElement):Backend|undefined {
  const ctx=canvas.getContext('2d');if(!ctx)return
  const blade=new Path2D('M5.408 -2.6Q-5.408 0 5.408 2.6H8V-2.6Z')
  const inverse=new Path2D('M-12 -12H12V12H-12Z M5.408 -2.6Q-5.408 0 5.408 2.6H8V-2.6Z')
  return {kind:'2d',maxDimension:4096,lost:()=>false,
    draw(pose,palette){
      ctx.clearRect(0,0,canvas.width,canvas.height)
      const scale=Math.max(canvas.width,canvas.height)/2
      const base=()=>ctx.setTransform(scale,0,0,scale,canvas.width/2,canvas.height/2)
      // An opaque union beneath the shaded cyclic clips prevents antialias seams.
      ctx.fillStyle=palette.face
      if(pose.shift===0)ctx.fillRect(0,0,canvas.width,canvas.height)
      else for(let i=0;i<9;i++){ctx.save();base();ctx.rotate(i*Math.PI*2/9+pose.turn);ctx.translate(pose.shift,0);ctx.fill(blade);ctx.restore()}
      for(let i=0;i<9;i++){
        ctx.save();base();ctx.rotate(((i+8)%9)*Math.PI*2/9+pose.turn);ctx.translate(pose.shift,0);ctx.clip(inverse,'evenodd')
        base();ctx.rotate(i*Math.PI*2/9+pose.turn);ctx.translate(pose.shift,0)
        const gradient=ctx.createLinearGradient(-.1,-.5,1.5,.65);gradient.addColorStop(0,palette.tip);gradient.addColorStop(.42,palette.face);gradient.addColorStop(1,palette.edge)
        ctx.fillStyle=gradient;ctx.fill(blade);ctx.restore()
      }
      if(pose.shift===0){ctx.save();base();ctx.fillStyle=palette.tip;ctx.beginPath();ctx.arc(0,0,.002,0,Math.PI*2);ctx.fill();ctx.restore()}
    },clear(){ctx.clearRect(0,0,canvas.width,canvas.height)},dispose(){} }
}

export function createIrisRenderer(mode:'auto'|'2d'='auto') {
  let canvas=document.createElement('canvas'), backend:Backend|undefined, disposed=false
  try{if(mode==='auto')backend=gpu(canvas)}catch{}
  if(!backend){canvas=document.createElement('canvas');try{backend=cpu(canvas)}catch{}}
  if(!backend)return
  const painter=backend
  canvas.className='aperture-canvas';canvas.setAttribute('aria-hidden','true');canvas.dataset.renderer=painter.kind
  return {canvas,kind:painter.kind,get lost(){return disposed||painter.lost()},
    resize(width:number,height:number,dpr=1){
      if(disposed)return
      const size=irisBufferSize(width,height,dpr,painter.kind==='webgl'?1500000:650000,painter.maxDimension)
      if(canvas.width!==size.width||canvas.height!==size.height){canvas.width=size.width;canvas.height=size.height}
    },
    draw(time:number,palette:IrisPalette=light){if(!disposed)painter.draw(irisPose(time),palette)},clear(){if(!disposed)painter.clear()},
    dispose(){if(disposed)return;disposed=true;painter.dispose();canvas.width=1;canvas.height=1;canvas.remove()}
  }
}
