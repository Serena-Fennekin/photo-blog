import type { PublicSettings, StorySummary } from '../../app/types/content'
import type { ContentRepository } from '../repositories/content-repository'

export type HomePageModel = {
  settings: PublicSettings
  stories: StorySummary[]
}

export const getHomePageModel = async (repository: ContentRepository): Promise<HomePageModel> => {
  const [settings, stories] = await Promise.all([
    repository.getPublicSettings(),
    repository.listHomeStories(12)
  ])

  const heroPhoto = settings.heroMode === 'latest'
    ? stories[0]?.cover ?? settings.lastValidHeroPhoto
    : settings.heroPhoto ?? settings.lastValidHeroPhoto

  return {
    settings: { ...settings, heroPhoto },
    stories
  }
}
