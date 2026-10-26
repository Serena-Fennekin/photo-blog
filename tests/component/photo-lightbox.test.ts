// @vitest-environment happy-dom

import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'

import ExifPanel from '../../app/components/gallery/ExifPanel.vue'
import PhotoLightbox from '../../app/components/gallery/PhotoLightbox.vue'
import { createFixtureContentRepository } from '../../server/repositories/fixture-content-repository'

describe('photo lightbox', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    document.body.style.overflow = ''
  })

  it('renders only the approved EXIF labels', () => {
    const wrapper = mount(ExifPanel, {
      props: {
        exif: {
          camera: 'FUJIFILM X-T5', lens: 'XF 35mm', focalLengthMm: 35,
          aperture: 2, shutter: '1/500', iso: 160, capturedAt: '2025-12-16',
          gpsLatitude: 30.25, serialNumber: 'SECRET'
        } as never
      }
    })

    expect(wrapper.text()).toContain('相机')
    expect(wrapper.text()).toContain('镜头')
    expect(wrapper.text()).toContain('焦距')
    expect(wrapper.text()).toContain('光圈')
    expect(wrapper.text()).toContain('快门')
    expect(wrapper.text()).toContain('ISO')
    expect(wrapper.text()).toContain('拍摄时间')
    expect(wrapper.text()).not.toContain('GPS')
    expect(wrapper.text()).not.toContain('SECRET')
  })

  it('navigates within siblings, locks the page, closes on Escape, and restores focus', async () => {
    const context = await createFixtureContentRepository().getPhotoContext('winter-2')
    const trigger = document.createElement('button')
    trigger.textContent = 'trigger'
    document.body.append(trigger)
    trigger.focus()

    const wrapper = mount(PhotoLightbox, {
      attachTo: document.body,
      props: { open: true, context },
      global: {
        stubs: {
          Teleport: true,
          NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' }
        }
      }
    })

    expect(document.body.style.overflow).toBe('hidden')
    await wrapper.get('[data-action="next"]').trigger('click')
    expect(wrapper.emitted('navigate')?.[0]).toEqual(['winter-3'])

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(wrapper.emitted('close')).toHaveLength(1)

    await wrapper.setProps({ open: false })
    await nextTick()
    expect(document.body.style.overflow).toBe('')
    expect(document.activeElement).toBe(trigger)
  })
})
