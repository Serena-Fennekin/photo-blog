import Lenis from 'lenis'
import 'lenis/dist/lenis.css'

export default defineNuxtPlugin(nuxtApp => {
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
  let lenis: Lenis | undefined
  const configure = () => {
    lenis?.destroy(); lenis = undefined
    if (!preference.matches && !location.pathname.startsWith('/admin')) lenis = new Lenis({ autoRaf: true, lerp: .065, wheelMultiplier: .7, smoothWheel: true, anchors: true, prevent: node => {
      const native=node.closest<HTMLElement>('[data-native-scroll]')
      return Boolean(node.closest('.photo-lightbox, .route-curtain, .admin-shell')) || document.body.style.position === 'fixed' || Boolean(native&&getComputedStyle(native).overflowY==='auto')
    } })
  }
  configure()
  preference.addEventListener('change', configure)
  nuxtApp.hook('page:finish', () => { configure(); lenis?.resize() })
  if (import.meta.hot) import.meta.hot.dispose(() => { preference.removeEventListener('change', configure); lenis?.destroy() })
})
