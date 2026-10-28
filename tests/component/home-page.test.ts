// @vitest-environment happy-dom

import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

import GalleryInvitation from '../../app/components/home/GalleryInvitation.vue'
import SiteFooter from '../../app/components/site/SiteFooter.vue'

describe('homepage content components', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('offers an explicit artistic entrance to the gallery', () => {
    const wrapper = mount(GalleryInvitation, {
      global: { stubs: { NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' } } }
    })

    expect(wrapper.get('a').attributes('href')).toBe('/gallery')
    expect(wrapper.text()).toContain('进入摄影集')
    expect(wrapper.findAll('h1')).toHaveLength(1)
    expect(wrapper.text()).toContain('只需要被安静地记录下来')
    expect(wrapper.text()).not.toContain('再看时，仍能回到当时')
  })

  it('reserves a registration slot without inventing an ICP number', () => {
    vi.stubGlobal('useRuntimeConfig', () => ({ public: { icpNumber: '' } }))
    const wrapper = mount(SiteFooter)
    expect(wrapper.text()).toContain('备案信息待更新')
    expect(wrapper.find('a').exists()).toBe(false)
  })

  it('uses the configured registration text and official lookup link', () => {
    vi.stubGlobal('useRuntimeConfig', () => ({ public: { icpNumber: 'TEST-REGISTRATION' } }))
    const wrapper = mount(SiteFooter)
    expect(wrapper.get('a').text()).toBe('TEST-REGISTRATION')
    expect(wrapper.get('a').attributes('href')).toBe('https://beian.miit.gov.cn/')
  })
})
