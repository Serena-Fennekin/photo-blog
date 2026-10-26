// @vitest-environment happy-dom

import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import ThemeSelector from '../../app/components/site/ThemeSelector.vue'

describe('ThemeSelector', () => {
  afterEach(() => {
    window.localStorage.clear()
    vi.unstubAllGlobals()
  })

  it('renders all three choices and persists the selected preference', async () => {
    const listeners = new Set<(event: MediaQueryListEvent) => void>()
    vi.stubGlobal('matchMedia', vi.fn(() => ({
      matches: false,
      media: '(prefers-color-scheme: dark)',
      onchange: null,
      addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => listeners.add(listener),
      removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => listeners.delete(listener),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn()
    })))

    const wrapper = mount(ThemeSelector, { attachTo: document.body })
    await nextTick()
    const labels = wrapper.get('[aria-label="颜色主题"]').findAll('button').map(button => button.text())

    expect(labels).toEqual(['跟随系统', '深色', '浅色'])
    await wrapper.get('button[data-theme-choice="dark"]').trigger('click')

    expect(window.localStorage.getItem('photo-journal-theme')).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(wrapper.get('button[data-theme-choice="dark"]').attributes('aria-pressed')).toBe('true')

    wrapper.unmount()
  })
})
