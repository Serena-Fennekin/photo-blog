import { describe, expect, it } from 'vitest'

import type { ContentRepository } from '../../server/repositories/content-repository'
import { createFixtureContentRepository } from '../../server/repositories/fixture-content-repository'
import { getHomePageModel } from '../../server/services/public-content-service'

const repositoryWith = (
  base: ContentRepository,
  overrides: Partial<ContentRepository>
): ContentRepository => ({ ...base, ...overrides })

describe('getHomePageModel', () => {
  it('preserves the selected photo in manual hero mode', async () => {
    const repository = createFixtureContentRepository()
    const settings = await repository.getPublicSettings()

    const model = await getHomePageModel(repository)

    expect(model.settings.heroMode).toBe('manual')
    expect(model.settings.heroPhoto?.id).toBe(settings.heroPhoto?.id)
  })

  it('uses the latest published photo in latest mode', async () => {
    const base = createFixtureContentRepository()
    const manualSettings = await base.getPublicSettings()
    const repository = repositoryWith(base, {
      getPublicSettings: async () => ({ ...manualSettings, heroMode: 'latest', heroPhoto: null })
    })

    const model = await getHomePageModel(repository)

    expect(model.photos[0]?.id).toBe('winter-1')
    expect(model.settings.heroPhoto?.id).toBe(model.photos[0]?.id)
  })

  it('keeps the last valid hero when latest mode has no published photos', async () => {
    const base = createFixtureContentRepository()
    const manualSettings = await base.getPublicSettings()
    const repository = repositoryWith(base, {
      listHomePhotos: async () => [],
      getPublicSettings: async () => ({ ...manualSettings, heroMode: 'latest', heroPhoto: null })
    })

    const model = await getHomePageModel(repository)

    expect(model.photos).toEqual([])
    expect(model.settings.heroPhoto?.id).toBe(manualSettings.lastValidHeroPhoto?.id)
  })
})
