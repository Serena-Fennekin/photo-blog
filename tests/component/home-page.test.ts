// @vitest-environment happy-dom

import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import GalleryInvitation from '../../app/components/home/GalleryInvitation.vue'
import HomeHero from '../../app/components/home/HomeHero.vue'
import FeaturedPhotos from '../../app/components/home/FeaturedPhotos.vue'
import { createFixtureContentRepository } from '../../server/repositories/fixture-content-repository'

describe('homepage content components', () => {
  it('keeps a new empty journal browsable before its first cover is selected', () => {
    const wrapper = mount(HomeHero, { props: { photo: null } })
    expect(wrapper.text()).toContain('看见喜欢的，就拍下来。')
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.text()).toContain('照片还在整理中')
  })
  it('renders the hero image responsively with its alt text', async () => {
    const repository = createFixtureContentRepository()
    const photo = (await repository.getPublicSettings()).heroPhoto!

    const wrapper = mount(HomeHero, { props: { photo }, global: { stubs: { NuxtLink: { template: '<a><slot /></a>' } } } })
    const image = wrapper.get('img')

    expect(wrapper.text()).toContain('看见喜欢的，就拍下来。')
    expect(image.attributes('alt')).toBe(photo.image.alt)
    expect(image.attributes('srcset')).toContain('640w')
    expect(image.attributes('width')).toBe(String(photo.image.width))
  })

  it('renders a small photo selection without large filename headings or chapter metadata', async () => {
    const photo = (await createFixtureContentRepository().listHomePhotos(1))[0]!
    photo.title = 'DSC02030-very-long-filename'

    const wrapper = mount(FeaturedPhotos, {
      props: { photos: [photo] },
      global: { stubs: { NuxtLink: { template: '<a><slot /></a>' } } }
    })

    expect(wrapper.text()).toContain('随手挑了几张')
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
  })
})
