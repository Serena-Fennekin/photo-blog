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
  let started = false
  const resolvedTheme = computed<ResolvedTheme>(() =>
    preference.value === 'system' ? systemTheme.value : preference.value
  )

  const apply = () => {
    root.dataset.theme = resolvedTheme.value
    root.dataset.themePreference = preference.value
  }

  // A suspended tab can miss change events; sample the current query on resume.
  const refreshSystem = () => {
    systemTheme.value = mediaQuery.matches ? 'dark' : 'light'
    apply()
  }

  const reloadPreference = () => {
    try { preference.value = normalizePreference(storage.getItem(THEME_STORAGE_KEY)) } catch { /* Preserve the session's choice if storage is denied. */ }
    refreshSystem()
  }

  const handleSystemChange = (event: Pick<MediaQueryListEvent, 'matches'>) => {
    systemTheme.value = event.matches ? 'dark' : 'light'
    if (preference.value === 'system') apply()
  }

  const setPreference = (next: ThemePreference) => {
    preference.value = next
    try { storage.setItem(THEME_STORAGE_KEY, next) } catch { /* The choice still works for this session. */ }
    refreshSystem()
  }

  const start = () => {
    if (started) return
    started = true
    reloadPreference()
    mediaQuery.addEventListener('change', handleSystemChange)
  }

  const stop = () => { started = false; mediaQuery.removeEventListener('change', handleSystemChange) }

  return { preference, resolvedTheme, setPreference, refreshSystem, reloadPreference, start, stop }
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
  let stopResume: (() => void) | undefined

  onMounted(() => {
    controller = createThemePreferenceController({
      storage: { getItem: key => window.localStorage.getItem(key), setItem: (key, value) => window.localStorage.setItem(key, value) },
      mediaQuery: window.matchMedia('(prefers-color-scheme: dark)'),
      root: document.documentElement
    })
    controller.start()
    const refresh = () => { if (document.visibilityState !== 'hidden') controller?.refreshSystem() }
    const syncStorage = (event: StorageEvent) => { if (event.key === THEME_STORAGE_KEY || event.key === null) controller?.reloadPreference() }
    window.addEventListener('focus', refresh)
    window.addEventListener('pageshow', refresh)
    document.addEventListener('visibilitychange', refresh)
    window.addEventListener('storage', syncStorage)
    stopResume = () => {
      window.removeEventListener('focus', refresh)
      window.removeEventListener('pageshow', refresh)
      document.removeEventListener('visibilitychange', refresh)
      window.removeEventListener('storage', syncStorage)
    }
    stopSync = watch(
      [controller.preference, controller.resolvedTheme],
      ([nextPreference, nextResolvedTheme]) => {
        preference.value = nextPreference
        resolvedTheme.value = nextResolvedTheme
      },
      { immediate: true, flush: 'sync' }
    )
  })

  onBeforeUnmount(() => {
    stopSync?.()
    stopResume?.()
    controller?.stop()
  })

  const setPreference = (next: ThemePreference) => {
    preference.value = next
    controller?.setPreference(next)
  }

  return { preference, resolvedTheme, setPreference }
}
