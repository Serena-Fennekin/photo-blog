import type { ContentRepository } from './content-repository'
import { createFixtureContentRepository } from './fixture-content-repository'

let repository: ContentRepository | undefined

export const getContentRepository = (): ContentRepository => {
  repository ??= createFixtureContentRepository()
  return repository
}
