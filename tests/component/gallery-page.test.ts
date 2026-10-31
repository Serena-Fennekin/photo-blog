// @vitest-environment happy-dom

import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, expect, it } from 'vitest'

import CategoryFilter from '../../app/components/gallery/CategoryFilter.vue'
import GalleryGrid from '../../app/components/gallery/GalleryGrid.vue'
import { mergeGalleryItems } from '../../app/utils/gallery'
import { createFixtureContentRepository } from '../../server/repositories/fixture-content-repository'

const NuxtLinkStub = defineComponent({
  props: { to: { type: [String, Object], required: true } },
  template: '<a :data-query="typeof to === `object` ? to.query?.category ?? `` : ``"><slot /></a>'
})

describe('gallery page components', () => {
  it('builds shareable category links and marks the active category', () => {
    const wrapper = mount(CategoryFilter, {
      props: {
        categories: [{ slug: 'nature', name: '自然' }, { slug: 'portrait', name: '人像' }],
        activeCategory: 'nature'
      },
      global: { stubs: { NuxtLink: NuxtLinkStub } }
    })

    expect(wrapper.get('[data-category="nature"]').attributes('data-query')).toBe('nature')
    expect(wrapper.get('[data-category="nature"]').attributes('aria-current')).toBe('page')
    expect(wrapper.get('[data-category="all"]').attributes('data-query')).toBe('')
  })

  it('shows an accessible empty state for a category with no photos', () => {
    const wrapper = mount(GalleryGrid, { props: { items: [] } })

    expect(wrapper.get('[role="status"]').text()).toContain('暂时没有照片')
  })

  it('preserves image ratio and omits the largest lightbox source', async () => {
    const item = (await createFixtureContentRepository().listGallery({ limit: 1 })).items[0]!
    const wrapper = mount(GalleryGrid, { props: { items: [item] } })
    const card = wrapper.get('[data-photo-id="winter-1"]')
    const image = card.get('img')

    expect(card.attributes('style')).toContain(`aspect-ratio: ${item.image.width} / ${item.image.height}`)
    expect(image.attributes('loading')).toBe('lazy')
    expect(image.attributes('srcset')).not.toContain('1920w')
  })

  it('appends a page without duplicating an item already displayed', async () => {
    const page = await createFixtureContentRepository().listGallery({ limit: 3 })

    const merged = mergeGalleryItems(page.items.slice(0, 2), page.items.slice(1))

    expect(merged.map(photo => photo.id)).toEqual(['winter-1', 'winter-2', 'winter-3'])
  })
})
