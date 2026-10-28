// @vitest-environment happy-dom

import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

import GalleryInvitation from '../../app/components/home/GalleryInvitation.vue'
import SiteFooter from '../../app/components/site/SiteFooter.vue'
import FeaturedPhotos from '../../app/components/home/FeaturedPhotos.vue'
import { createFixtureContentRepository } from '../../server/repositories/fixture-content-repository'

describe('homepage content components', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('renders a small photo selection without large filename headings or chapter metadata', async () => {
    const photo = (await createFixtureContentRepository().listHomePhotos(1))[0]!
    photo.title = 'DSC02030-very-long-filename'

    const wrapper = mount(FeaturedPhotos, {
      props: { photos: [photo] },
      global: { stubs: { NuxtLink: { template: '<a><slot /></a>' } } }
    })

    expect(wrapper.text()).toContain('留在照片里的日子')
    expect(wrapper.text()).toContain(photo.caption)
    expect(wrapper.text()).not.toContain(photo.title)
    expect(wrapper.find('[data-featured-photo-id]').attributes('data-featured-photo-id')).toBe(photo.id)
    expect(wrapper.findAll('img')).toHaveLength(1)
  })

  it('does not add an empty featured section', () => {
    expect(mount(FeaturedPhotos, { props: { photos: [] } }).find('section').exists()).toBe(false)
  })

  it('offers an explicit artistic entrance to the gallery', () => {
    const wrapper = mount(GalleryInvitation, {
      global: { stubs: { NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' } } }
    })

    expect(wrapper.get('a').attributes('href')).toBe('/gallery')
    expect(wrapper.text()).toContain('进入摄影集')
    expect(wrapper.findAll('h1')).toHaveLength(1)
    expect(wrapper.text()).toContain('只需要被安静地记录下来')
  })

  it('keeps source order when distributing featured photos across uneven columns', async () => {
    const photos = await createFixtureContentRepository().listHomePhotos(4)
    const wrapper = mount(FeaturedPhotos, { props: { photos }, global: { stubs: { NuxtLink: { template: '<a><slot /></a>' } } } })
    expect(wrapper.findAll('.home-featured__column')).toHaveLength(2)
    expect(wrapper.findAll('[data-featured-photo-id]').map(node => node.attributes('data-featured-photo-id'))).toEqual(photos.map(photo => photo.id))
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
