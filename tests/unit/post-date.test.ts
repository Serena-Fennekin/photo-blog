import { expect, it } from 'vitest'
import { formatPostDate } from '../../shared/notebook'
it('shows camera-journal publication date and time consistently in Shanghai', () => {
  expect(formatPostDate('2026-10-30T00:15:00.000Z')).toBe('2026年10月30日 08:15')
  expect(formatPostDate('2026-10-29T17:20:00.000Z')).toBe('2026年10月30日 01:20')
  expect(formatPostDate('invalid')).toBe('时间待更新')
})
