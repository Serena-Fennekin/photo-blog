export const useReadingVisibility = () => {
  const readable = ref(false)
  let cleanup = () => {}
  onMounted(() => {
    const sync = () => { readable.value = !document.hidden && !document.querySelector('.photo-lightbox, dialog[open], [data-route-curtain]:not([data-state="idle"])') }
    const observer = new MutationObserver(sync)
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['open', 'data-state'] })
    document.addEventListener('visibilitychange', sync)
    sync()
    cleanup = () => { observer.disconnect(); document.removeEventListener('visibilitychange', sync) }
  })
  onBeforeUnmount(() => cleanup())
  return readonly(readable)
}
