import Lenis from 'lenis'
import { onBeforeUnmount, onMounted, type Ref } from 'vue'

// A separate wheel controller keeps the feed's damping without moving the document.
export function useNotebookScroll(root: Ref<HTMLElement|null>) {
  let cleanup=()=>{}
  onMounted(()=>{
    const wide=matchMedia('(min-width:901px)'), motion=matchMedia('(prefers-reduced-motion: reduce)')
    let smooth:Lenis|undefined, resizeFrame=0
    const configure=()=>{
      smooth?.destroy();smooth=undefined
      if(root.value&&wide.matches&&!motion.matches) smooth=new Lenis({wrapper:root.value,content:root.value,autoRaf:true,lerp:.065,wheelMultiplier:.7,smoothWheel:true,overscroll:false})
    }
    const resize=()=>{cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(()=>smooth?.resize())}
    const focus=()=>{if(root.value)smooth?.scrollTo(root.value.scrollTop,{immediate:true})}
    const observer=new MutationObserver(resize)
    if(root.value){observer.observe(root.value,{childList:true});root.value.addEventListener('load',resize,true);root.value.addEventListener('focusin',focus)}
    wide.addEventListener('change',configure);motion.addEventListener('change',configure)
    configure()
    cleanup=()=>{observer.disconnect();cancelAnimationFrame(resizeFrame);root.value?.removeEventListener('load',resize,true);root.value?.removeEventListener('focusin',focus);wide.removeEventListener('change',configure);motion.removeEventListener('change',configure);smooth?.destroy()}
  })
  onBeforeUnmount(()=>cleanup())
}
