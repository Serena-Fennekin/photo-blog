import { computed, onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'

export type ThemePreference = 'system' | 'dark' | 'light'
export type ResolvedTheme = 'dark' | 'light'

type ThemeStorage = Pick<Storage, 'getItem' | 'setItem'>
type ThemeMediaQuery = Pick<MediaQueryList, 'matches' | 'addEventListener' | 'removeEventListener'>
type ThemeRoot = { dataset: Record<string, string> | DOMStringMap }

type ThemeControllerOptions = {
  storage: ThemeStorage
  mediaQuery: ThemeMediaQuery
  root: ThemeRoot
}

export const THEME_STORAGE_KEY = 'photo-journal-theme'
export const themePreferences: ThemePreference[] = ['system', 'dark', 'light']

const normalizePreference = (value: string | null): ThemePreference =>
  themePreferences.includes(value as ThemePreference) ? value as ThemePreference : 'system'

export const createThemePreferenceController = ({ storage, mediaQuery, root }: ThemeControllerOptions) => {
  const preference = ref<ThemePreference>('system')
  const systemTheme = ref<ResolvedTheme>(mediaQuery.matches ? 'dark' : 'light')
  const resolvedTheme = computed<ResolvedTheme>(() =>
    preference.value === 'system' ? systemTheme.value : preference.value
  )

  const apply = () => {
    root.dataset.theme = resolvedTheme.value
  }

  const handleSystemChange = (event: Pick<MediaQueryListEvent, 'matches'>) => {
    systemTheme.value = event.matches ? 'dark' : 'light'
    if (preference.value === 'system') apply()
  }

  const setPreference = (next: ThemePreference) => {
    preference.value = next
    storage.setItem(THEME_STORAGE_KEY, next)
    apply()
  }

  const start = () => {
    preference.value = normalizePreference(storage.getItem(THEME_STORAGE_KEY))
    systemTheme.value = mediaQuery.matches ? 'dark' : 'light'
    mediaQuery.addEventListener('change', handleSystemChange)
    apply()
  }

  const stop = () => mediaQuery.removeEventListener('change', handleSystemChange)

  return { preference, resolvedTheme, setPreference, start, stop }
}

export const useThemePreference = (): {
  preference: Ref<ThemePreference>
  resolvedTheme: Ref<ResolvedTheme>
  setPreference: (preference: ThemePreference) => void
} => {
  const preference = ref<ThemePreference>('system')
  const resolvedTheme = ref<ResolvedTheme>('light')
  let controller: ReturnType<typeof createThemePreferenceController> | undefined
  let stopSync: (() => void) | undefined

  onMounted(() => {
    controller = createThemePreferenceController({
      storage: window.localStorage,
      mediaQuery: window.matchMedia('(prefers-color-scheme: dark)'),
      root: document.documentElement
    })
    controller.start()
    stopSync = watch(
      [controller.preference, controller.resolvedTheme],
      ([nextPreference, nextResolvedTheme]) => {
        preference.value = nextPreference
        resolvedTheme.value = nextResolvedTheme
      },
      { immediate: true }
    )
  })

  onBeforeUnmount(() => {
    stopSync?.()
    controller?.stop()
  })

  const setPreference = (next: ThemePreference) => {
    preference.value = next
    controller?.setPreference(next)
  }

  return { preference, resolvedTheme, setPreference }
}
