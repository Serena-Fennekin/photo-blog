import { describe, expect, it } from 'vitest'
import { categoryPresentation } from '../../app/utils/category-presentation'

describe('category chrome', () => {
  it('keeps the name while replacing pictographic graphemes with vector choices', () => {
    expect(categoryPresentation('猫猫🐱')).toEqual({ text:'猫猫', icons:['cat'] })
    expect(categoryPresentation('骑行🚴‍♂️')).toEqual({ text:'骑行', icons:['bike'] })
    expect(categoryPresentation('花草🌿 🌸')).toEqual({ text:'花草', icons:['leaf','flower'] })
  })
  it('keeps ordinary Unicode names and provides a usable name for emoji-only categories', () => {
    expect(categoryPresentation('山与海 · 2026')).toEqual({ text:'山与海 · 2026',icons:[] })
    expect(categoryPresentation('🦐')).toEqual({ text:'水中生灵',icons:['shrimp'] })
    expect(categoryPresentation('🪄')).toEqual({ text:'随手记录',icons:['sparkles'] })
  })
})
