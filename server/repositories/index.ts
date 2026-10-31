import type { ContentRepository } from './content-repository'
import { createFixtureContentRepository } from './fixture-content-repository'
import { getJournalStore } from '../db/journal-store'
import { createSqliteContentRepository } from './sqlite-content-repository'

let repository: ContentRepository | undefined

export const getContentRepository = (): ContentRepository => {
  repository ??= process.env.JOURNAL_REPOSITORY === 'fixture' ? createFixtureContentRepository() : createSqliteContentRepository(getJournalStore())
  return repository
}
