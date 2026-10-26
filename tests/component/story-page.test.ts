// @vitest-environment happy-dom

import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

import StoryHeader from '../../app/components/story/StoryHeader.vue'
import StorySequence from '../../app/components/story/StorySequence.vue'
import { createFixtureContentRepository } from '../../server/repositories/fixture-content-repository'

describe('story page', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('renders repository photo order and an explicit alt attribute for every image', async () => {
    const story = await createFixtureContentRepository().getStoryBySlug('winter-light')
    const header = mount(StoryHeader, { props: { story: story! } })
    const sequence = mount(StorySequence, { props: { story: story! } })

    expect(header.get('h1').text()).toBe('冬日侧光')
    expect(sequence.findAll('[data-story-photo-id]').map(node => node.attributes('data-story-photo-id')))
      .toEqual(story!.photos.map(photo => photo.id))
    expect(sequence.findAll('img').map(image => image.attributes('alt')))
      .toEqual(story!.photos.map(photo => photo.image.alt))
  })

  it('turns an unknown story slug into a 404 response', async () => {
    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
    vi.stubGlobal('getRouterParam', (event: { context: { params: Record<string, string> } }, key: string) => event.context.params[key])
    vi.stubGlobal('createError', (input: Record<string, unknown>) => Object.assign(new Error(String(input.statusMessage)), input))

    const { default: handler } = await import('../../server/api/public/stories/[slug].get')
    await expect(handler({ context: { params: { slug: 'missing-story' } } } as never))
      .rejects.toMatchObject({ statusCode: 404 })
  })
})
