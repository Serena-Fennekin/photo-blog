// @vitest-environment happy-dom
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { usePhotoLightbox } from '../../app/composables/usePhotoLightbox'
import { createFixtureContentRepository } from '../../server/repositories/fixture-content-repository'

describe('lightbox pending request ownership', () => {
  it('does not reopen after closing while an image context is still loading', async () => {
    const context = (await createFixtureContentRepository().getPhotoContext('winter-1'))!
    let resolve!: (value: typeof context) => void
    const deferred = new Promise<typeof context>(done => { resolve = done })
    let lightbox!: ReturnType<typeof usePhotoLightbox>
    const wrapper = mount(defineComponent({ setup() { lightbox = usePhotoLightbox(() => deferred); return () => h('div') } }))
    const pending = lightbox.openPhoto('winter-1')
    lightbox.closePhoto()
    resolve(context); await pending
    expect(lightbox.isOpen.value).toBe(false)
    wrapper.unmount()
  })
  it('ignores a stale context response when a newer photo has already loaded', async () => {
    const repository = createFixtureContentRepository()
    const first = (await repository.getPhotoContext('winter-1'))!, second = (await repository.getPhotoContext('winter-2'))!
    let resolve!: (value: typeof first) => void
    const deferred = new Promise<typeof first>(done => { resolve = done })
    let lightbox!: ReturnType<typeof usePhotoLightbox>
    const wrapper = mount(defineComponent({ setup() { lightbox = usePhotoLightbox(id => id === 'winter-1' ? deferred : Promise.resolve(second)); return () => h('div') } }))
    const old = lightbox.openPhoto('winter-1')
    await lightbox.openPhoto('winter-2'); resolve(first); await old
    expect(lightbox.context.value?.photo.id).toBe('winter-2')
    wrapper.unmount()
  })
})
