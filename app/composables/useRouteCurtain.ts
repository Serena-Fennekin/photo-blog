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
}

const defaultTiming: RouteCurtainTiming = {
  nextFrame: () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
  wait: duration => new Promise(resolve => setTimeout(resolve, duration)),
  reducedMotion: () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export const isCurtainTarget = (path: string): boolean => path === '/gallery' || path === '/about'

export const createRouteCurtainController = (
  router: CurtainRouter,
  timing: RouteCurtainTiming = defaultTiming
): { phase: Readonly<Ref<CurtainPhase>>, dispose: () => void } => {
  const state = ref<CurtainPhase>('idle')
  let disposed = false
  let targetNavigationPending = false
  let coverPromise: Promise<void> | undefined
  let revealPromise: Promise<void> | undefined

  const cover = async () => {
    state.value = 'preparing'
    await timing.nextFrame()
    if (disposed) return
    state.value = 'covering'
    await timing.wait(380)
    if (disposed) return
    state.value = 'covered'
  }

  const reveal = async () => {
    await timing.nextFrame()
    if (disposed) return
    state.value = 'revealing'
    await timing.wait(520)
    if (disposed) return
    state.value = 'idle'
  }

  const removeBefore = router.beforeEach(async (to, from) => {
    if (!isCurtainTarget(to.path) || to.path === from.path || timing.reducedMotion()) return

    if (revealPromise) await revealPromise
    if (disposed) return

    targetNavigationPending = true
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
    dispose: () => {
      disposed = true
      state.value = 'idle'
      removeBefore()
      removeAfter()
    }
  }
}

export const useRouteCurtain = (): { phase: Readonly<Ref<CurtainPhase>> } => {
  const serverPhase = readonly(ref<CurtainPhase>('idle')) as Readonly<Ref<CurtainPhase>>
  if (import.meta.server) return { phase: serverPhase }

  const controller = createRouteCurtainController(useRouter() as unknown as CurtainRouter)
  onScopeDispose(controller.dispose)

  return { phase: controller.phase }
}
