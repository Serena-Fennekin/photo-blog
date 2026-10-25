// @vitest-environment happy-dom

import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import GalleryInvitation from '../../app/components/home/GalleryInvitation.vue'
import HomeHero from '../../app/components/home/HomeHero.vue'
import TimeChapter from '../../app/components/home/TimeChapter.vue'
import { createFixtureContentRepository } from '../../server/repositories/fixture-content-repository'

describe('homepage content components', () => {
  it('renders the hero image responsively with its alt text', async () => {
    const repository = createFixtureContentRepository()
    const photo = (await repository.getPublicSettings()).heroPhoto!

    const wrapper = mount(HomeHero, { props: { photo } })
    const image = wrapper.get('img')

    expect(wrapper.text()).toContain('日常，经过光之后')
    expect(image.attributes('alt')).toBe(photo.image.alt)
    expect(image.attributes('srcset')).toContain('640w')
    expect(image.attributes('width')).toBe(String(photo.image.width))
  })

  it('renders a dated chapter with location, note, and preview photos', async () => {
    const story = (await createFixtureContentRepository().listHomeStories(1))[0]!

    const wrapper = mount(TimeChapter, {
      props: { story },
      global: { stubs: { NuxtLink: { template: '<a><slot /></a>' } } }
    })

    expect(wrapper.text()).toContain('2025.12.16')
    expect(wrapper.text()).toContain('杭州 · 临安')
    expect(wrapper.text()).toContain(story.note)
    expect(wrapper.findAll('img')).toHaveLength(story.previewPhotos.length)
  })

  it('offers an explicit artistic entrance to the gallery', () => {
    const wrapper = mount(GalleryInvitation, {
      global: { stubs: { NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' } } }
    })

    expect(wrapper.get('a').attributes('href')).toBe('/gallery')
    expect(wrapper.text()).toContain('进入摄影集')
  })
})
