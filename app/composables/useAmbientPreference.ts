export const useAmbientPreference = () => {
  const enabled = useState('ambient-enabled', () => true)
  onMounted(() => { try { const stored = localStorage.getItem('photo-journal-ambient'); if (stored !== null) enabled.value = stored !== 'off' } catch {} })
  function toggle() { enabled.value = !enabled.value; try { localStorage.setItem('photo-journal-ambient', enabled.value ? 'on' : 'off') } catch {} }
  return { enabled, toggle }
}
