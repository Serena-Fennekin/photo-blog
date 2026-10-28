import { onScopeDispose, readonly, ref, type Ref } from 'vue'

export type CurtainPhase = 'idle' | 'preparing' | 'covering' | 'covered' | 'revealing'

type CurtainRoute = { path: string }
type CurtainHook = (to: CurtainRoute, from: CurtainRoute) => void | Promise<void>

interface CurtainRouter {
  beforeEach: (hook: CurtainHook) => () => void
  afterEach: (hook: CurtainHook) => () => void
}

interface RouteCurtainTiming {
  nextFrame: () => Promise<void>
  wait: (duration: number) => Promise<void>
  reducedMotion: () => boolean
  snapshot?: () => { html: string; scrollY: number }
}

const defaultTiming: RouteCurtainTiming = {
  nextFrame: () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
  wait: duration => new Promise(resolve => setTimeout(resolve, duration)),
  reducedMotion: () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  snapshot: () => {
    const clone = document.querySelector('.site-shell')?.cloneNode(true) as HTMLElement | undefined
    clone?.querySelectorAll('.route-curtain, canvas, script, iframe').forEach(element => element.remove())
    clone?.querySelectorAll('[id]').forEach(element => element.removeAttribute('id'))
    return { html: clone?.outerHTML ?? '', scrollY: window.scrollY }
  }
}

export const isCurtainTarget = (path: string): boolean => path === '/gallery' || path === '/about'

export const createRouteCurtainController = (
  router: CurtainRouter,
  timing: RouteCurtainTiming = defaultTiming
 ) => {
  const state = ref<CurtainPhase>('idle')
  const target = ref<'gallery' | 'about' | null>(null)
  const snapshot = ref({ html: '', scrollY: 0 })
  let disposed = false
  let targetNavigationPending = false
  let coverPromise: Promise<void> | undefined
  let revealPromise: Promise<void> | undefined

  const cover = async () => {
    state.value = 'preparing'
    await timing.nextFrame()
    if (disposed) return
    state.value = 'covering'
    if (target.value === 'gallery') await timing.wait(480)
    if (disposed) return
    state.value = 'covered'
  }

  const reveal = async () => {
    await timing.nextFrame()
    if (disposed) return
    state.value = 'revealing'
    await timing.wait(target.value === 'gallery' ? 1420 : 2900)
    if (disposed) return
    state.value = 'idle'
    snapshot.value = { html: '', scrollY: 0 }
  }

  const removeBefore = router.beforeEach(async (to, from) => {
    if (!isCurtainTarget(to.path) || to.path === from.path || from.path.startsWith('/admin') || timing.reducedMotion()) return

    if (revealPromise) await revealPromise
    if (disposed) return

    targetNavigationPending = true
    target.value = to.path === '/gallery' ? 'gallery' : 'about'
    snapshot.value = target.value === 'about' ? timing.snapshot?.() ?? { html: '', scrollY: 0 } : { html: '', scrollY: 0 }
    coverPromise ??= cover()
    await coverPromise
  })

  const removeAfter = router.afterEach(async () => {
    if (!targetNavigationPending || state.value !== 'covered' || disposed) return

    targetNavigationPending = false
    revealPromise = reveal().finally(() => {
      coverPromise = undefined
      revealPromise = undefined
    })
    await revealPromise
  })

  return {
    phase: readonly(state) as Readonly<Ref<CurtainPhase>>,
    target: readonly(target),
    snapshot: readonly(snapshot),
    dispose: () => {
      disposed = true
      state.value = 'idle'
      removeBefore()
      removeAfter()
    }
  }
}

export const useRouteCurtain = () => {
  const serverPhase = readonly(ref<CurtainPhase>('idle')) as Readonly<Ref<CurtainPhase>>
  if (import.meta.server) return { phase: serverPhase, target: readonly(ref<'gallery' | 'about' | null>(null)), snapshot: readonly(ref({ html: '', scrollY: 0 })) }

  const controller = createRouteCurtainController(useRouter() as unknown as CurtainRouter)
  onScopeDispose(controller.dispose)

  return { phase: controller.phase, target: controller.target, snapshot: controller.snapshot }
}
