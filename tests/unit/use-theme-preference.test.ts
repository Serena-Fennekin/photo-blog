import { describe, expect, it } from 'vitest'

import { createThemePreferenceController } from '../../app/composables/useThemePreference'

class MemoryStorage {
  private readonly values = new Map<string, string>()

  getItem(key: string) {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string) {
    this.values.set(key, value)
  }
}

class FakeMediaQuery {
  matches = false
  private readonly listeners = new Set<(event: { matches: boolean }) => void>()

  addEventListener(_type: 'change', listener: (event: { matches: boolean }) => void) {
    this.listeners.add(listener)
  }

  removeEventListener(_type: 'change', listener: (event: { matches: boolean }) => void) {
    this.listeners.delete(listener)
  }

  emit(matches: boolean) {
    this.matches = matches
    for (const listener of this.listeners) listener({ matches })
  }
}

describe('theme preference controller', () => {
  it('defaults invalid storage to system and resolves the current system theme', () => {
    const storage = new MemoryStorage()
    storage.setItem('photo-journal-theme', 'sepia')
    const mediaQuery = new FakeMediaQuery()
    mediaQuery.matches = true
    const root = { dataset: {} as Record<string, string> }

    const controller = createThemePreferenceController({ storage, mediaQuery, root })
    controller.start()

    expect(controller.preference.value).toBe('system')
    expect(controller.resolvedTheme.value).toBe('dark')
    expect(root.dataset.theme).toBe('dark')
  })

  it('persists explicit themes and ignores later system changes', () => {
    const storage = new MemoryStorage()
    const mediaQuery = new FakeMediaQuery()
    const root = { dataset: {} as Record<string, string> }
    const controller = createThemePreferenceController({ storage, mediaQuery, root })
    controller.start()

    controller.setPreference('light')
    mediaQuery.emit(true)

    expect(storage.getItem('photo-journal-theme')).toBe('light')
    expect(controller.resolvedTheme.value).toBe('light')
    expect(root.dataset.theme).toBe('light')
  })

  it('tracks live system changes only while preference is system', () => {
    const storage = new MemoryStorage()
    const mediaQuery = new FakeMediaQuery()
    const root = { dataset: {} as Record<string, string> }
    const controller = createThemePreferenceController({ storage, mediaQuery, root })
    controller.start()

    mediaQuery.emit(true)
    expect(controller.resolvedTheme.value).toBe('dark')

    controller.setPreference('light')
    mediaQuery.emit(false)
    expect(controller.resolvedTheme.value).toBe('light')

    controller.setPreference('system')
    expect(controller.resolvedTheme.value).toBe('light')
    mediaQuery.emit(true)
    expect(controller.resolvedTheme.value).toBe('dark')
  })
  it('samples the current OS preference when system is selected after a missed change event',()=>{
    const mediaQuery=new FakeMediaQuery(),root={dataset:{} as Record<string,string>}
    const controller=createThemePreferenceController({storage:new MemoryStorage(),mediaQuery,root})
    controller.start();controller.setPreference('light')
    mediaQuery.matches=true // e.g. a suspended tab missed the notification.
    controller.setPreference('system')
    expect(root.dataset.theme).toBe('dark')
  })
  it('still follows the OS and allows an explicit choice if storage access is denied',()=>{
    const mediaQuery=new FakeMediaQuery(),root={dataset:{} as Record<string,string>}
    mediaQuery.matches=true
    const storage={getItem(){throw new Error('denied')},setItem(){throw new Error('denied')}}
    const controller=createThemePreferenceController({storage,mediaQuery,root})
    expect(()=>controller.start()).not.toThrow()
    expect(root.dataset.theme).toBe('dark')
    expect(()=>controller.setPreference('light')).not.toThrow()
    expect(root.dataset.theme).toBe('light')
    mediaQuery.emit(true);expect(root.dataset.theme).toBe('light')
    controller.stop()
  })
})
