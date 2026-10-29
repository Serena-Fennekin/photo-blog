import { expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createRouteCurtainController } from '../../app/composables/useRouteCurtain'

const deferred = () => { let resolve!: () => void; const promise = new Promise<void>(done => { resolve = done }); return { promise, resolve } }
const makeRouter = () => createRouter({ history: createMemoryHistory(), routes: ['/', '/gallery', '/about'].map(path => ({ path, component: { render: () => null } })) })

it('releases the about overlay after a real thrown navigation error', async () => {
  const router = makeRouter(); await router.push('/')
  const controller = createRouteCurtainController(router, { nextFrame: () => Promise.resolve(), wait: () => Promise.resolve(), reducedMotion: () => false })
  const failure = new Error('chunk failed')
  router.beforeResolve(to => { if (to.path === '/about') throw failure })
  await expect(router.push('/about')).rejects.toBe(failure)
  expect(router.currentRoute.value.path).toBe('/')
  expect(controller.phase.value).toBe('idle')
  expect(controller.snapshot.value.html).toBe('')
  controller.dispose()
})

it('keeps newer artwork when an older navigation to the same pathname fails', async () => {
  const router = makeRouter(); await router.push('/')
  const finish = deferred(), enteredFirst = deferred(), enteredSecond = deferred(), firstGate = deferred(), secondGate = deferred()
  const controller = createRouteCurtainController(router, { nextFrame: () => Promise.resolve(), wait: () => finish.promise, reducedMotion: () => false })
  router.beforeResolve(to => {
    if (to.path !== '/gallery') return
    if (to.query.category) { enteredSecond.resolve(); return secondGate.promise }
    enteredFirst.resolve(); return firstGate.promise
  })
  const first = router.push('/gallery'); await enteredFirst.promise
  const second = router.push('/gallery?category=nature'); await enteredSecond.promise
  firstGate.resolve(); await first
  expect(controller.target.value).toBe('gallery')
  expect(controller.phase.value).toBe('covered')
  secondGate.resolve(); await second; await Promise.resolve()
  expect(controller.phase.value).toBe('revealing')
  finish.resolve(); await Promise.resolve()
  controller.dispose()
})
