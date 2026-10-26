import { describe, expect, it, vi } from 'vitest'

import {
  createRouteCurtainController,
  isCurtainTarget
} from '../../app/composables/useRouteCurtain'

type RouteHook = (to: { path: string }) => void | Promise<void>

const deferred = () => {
  let resolve!: () => void
  const promise = new Promise<void>((done) => {
    resolve = done
  })
  return { promise, resolve }
}

const createRouter = () => {
  let beforeHook: RouteHook = () => undefined
  let afterHook: RouteHook = () => undefined
  const removeBefore = vi.fn()
  const removeAfter = vi.fn()

  return {
    router: {
      beforeEach: vi.fn((hook: RouteHook) => {
        beforeHook = hook
        return removeBefore
      }),
      afterEach: vi.fn((hook: RouteHook) => {
        afterHook = hook
        return removeAfter
      })
    },
    before: (path: string) => beforeHook({ path }),
    after: (path: string) => afterHook({ path }),
    removeBefore,
    removeAfter
  }
}

describe('route curtain targets', () => {
  it.each(['/gallery', '/about'])('targets %s', (path) => {
    expect(isCurtainTarget(path)).toBe(true)
  })

  it.each(['/', '/stories/winter-light', '/gallery/nature', '/about/me'])('does not target %s', (path) => {
    expect(isCurtainTarget(path)).toBe(false)
  })
})

describe('createRouteCurtainController', () => {
  it('covers the viewport before target navigation continues, then reveals and resets', async () => {
    const fake = createRouter()
    const cover = deferred()
    const reveal = deferred()
    const wait = vi.fn()
      .mockImplementationOnce(() => cover.promise)
      .mockImplementationOnce(() => reveal.promise)
    const controller = createRouteCurtainController(fake.router, {
      nextFrame: () => Promise.resolve(),
      wait,
      reducedMotion: () => false
    })

    let continued = false
    const navigation = Promise.resolve(fake.before('/gallery')).then(() => {
      continued = true
    })
    await Promise.resolve()

    expect(controller.phase.value).toBe('covering')
    expect(continued).toBe(false)
    expect(wait).toHaveBeenNthCalledWith(1, 380)

    cover.resolve()
    await navigation
    expect(controller.phase.value).toBe('covered')

    const afterNavigation = Promise.resolve(fake.after('/gallery'))
    await Promise.resolve()
    expect(controller.phase.value).toBe('revealing')
    expect(wait).toHaveBeenNthCalledWith(2, 520)

    reveal.resolve()
    await afterNavigation
    expect(controller.phase.value).toBe('idle')
  })

  it('does not delay navigation or animate when reduced motion is requested', async () => {
    const fake = createRouter()
    const nextFrame = vi.fn(() => Promise.resolve())
    const wait = vi.fn(() => Promise.resolve())
    const controller = createRouteCurtainController(fake.router, {
      nextFrame,
      wait,
      reducedMotion: () => true
    })

    await fake.before('/about')
    await fake.after('/about')

    expect(controller.phase.value).toBe('idle')
    expect(nextFrame).not.toHaveBeenCalled()
    expect(wait).not.toHaveBeenCalled()
  })

  it('keeps non-target routes idle and unregisters both router hooks', async () => {
    const fake = createRouter()
    const wait = vi.fn(() => Promise.resolve())
    const controller = createRouteCurtainController(fake.router, {
      nextFrame: () => Promise.resolve(),
      wait,
      reducedMotion: () => false
    })

    await fake.before('/stories/winter-light')
    await fake.after('/stories/winter-light')
    expect(controller.phase.value).toBe('idle')
    expect(wait).not.toHaveBeenCalled()

    controller.dispose()
    expect(fake.removeBefore).toHaveBeenCalledOnce()
    expect(fake.removeAfter).toHaveBeenCalledOnce()
  })
})
