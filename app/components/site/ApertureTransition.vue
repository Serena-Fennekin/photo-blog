<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import type { CurtainPhase } from '~/composables/useRouteCurtain'
import { IRIS_DURATION } from '~/utils/iris-motion'
import { createIrisRenderer, type IrisPalette } from '~/utils/iris-renderer'
const props=defineProps<{phase:CurtainPhase}>()
const root=ref<HTMLElement|null>(null), ready=ref(false)
let renderer:ReturnType<typeof createIrisRenderer>, frame=0, start=0, current=0, idle=0, disposed=false, dispose=()=>{}
let palette:IrisPalette={tip:'#b5c7bf',face:'#dce5df',edge:'#bfcfc7'}
function contextLost(){if(props.phase!=='idle')resize()}
function prepare(){
  if(disposed)return
  if(renderer&&!renderer.lost)return
  renderer?.canvas.removeEventListener('webglcontextlost',contextLost)
  const mode=renderer?.lost?'2d':'auto';renderer?.dispose();renderer=createIrisRenderer(mode)
  if(renderer&&root.value){root.value.append(renderer.canvas);renderer.canvas.addEventListener('webglcontextlost',contextLost);renderer.resize(1,1);renderer.draw(0,palette)}
  ready.value=Boolean(renderer)
}
function colors(){
  if(!root.value)return
  const style=getComputedStyle(root.value)
  palette={tip:style.getPropertyValue('--iris-tip').trim(),face:style.getPropertyValue('--iris-face').trim(),edge:style.getPropertyValue('--iris-edge').trim()}
}
function paint(){if(disposed)return;prepare();renderer?.draw(current,palette)}
function resize(){
  if(props.phase==='idle'||!root.value)return
  prepare();const bounds=root.value.getBoundingClientRect();renderer?.resize(bounds.width,bounds.height,devicePixelRatio);paint()
}
function sync(){
  cancelAnimationFrame(frame)
  if(props.phase==='idle'){renderer?.clear();return}
  current=0;colors();resize()
  if(props.phase!=='revealing')return
  start=performance.now()
  const tick=(now:number)=>{current=Math.min(1,(now-start)/IRIS_DURATION);paint();if(current<1)frame=requestAnimationFrame(tick)}
  frame=requestAnimationFrame(tick)
}
onMounted(()=>{
  colors()
  const size=new ResizeObserver(resize),theme=new MutationObserver(()=>{colors();if(props.phase!=='idle')paint()})
  size.observe(root.value!);theme.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']})
  const unwatch=watch(()=>props.phase,sync,{flush:'post'})
  if(props.phase!=='idle')sync()
  else if(!matchMedia('(prefers-reduced-motion: reduce)').matches)idle=window.setTimeout(prepare,180)
  dispose=()=>{disposed=true;clearTimeout(idle);cancelAnimationFrame(frame);unwatch();size.disconnect();theme.disconnect();renderer?.canvas.removeEventListener('webglcontextlost',contextLost);renderer?.dispose()}
})
onBeforeUnmount(()=>dispose())
</script>
<template><div ref="root" class="aperture-scene" :data-aperture-phase="phase" :data-ready="ready"></div></template>
<style scoped>
.aperture-scene { --iris-tip:#b5c7bf;--iris-face:#dce5df;--iris-edge:#bfcfc7;position:absolute;inset:0;overflow:hidden;pointer-events:none;background:var(--iris-face); }
:global(:root[data-theme="dark"] .aperture-scene) { --iris-tip:#14241d;--iris-face:#35443b;--iris-edge:#1d2d24; }
.aperture-scene[data-aperture-phase="revealing"],.aperture-scene[data-ready="false"] { background:transparent; }
.aperture-scene :deep(.aperture-canvas) { display:block;width:100%;height:100%; }
</style>
