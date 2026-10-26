import { computed, onBeforeUnmount, onMounted, shallowRef } from 'vue'

import type { PhotoContext } from '~/types/content'

type FetchPhotoContext = (photoId: string) => Promise<PhotoContext>

const photoUrl = (photoId?: string) => {
  const url = new URL(window.location.href)
  if (photoId) url.searchParams.set('photo', photoId)
  else url.searchParams.delete('photo')
  return `${url.pathname}${url.search}${url.hash}`
}

export const usePhotoLightbox = (fetchContext?: FetchPhotoContext) => {
  const context = shallowRef<PhotoContext | null>(null)
  const loading = shallowRef(false)
  const originScrollY = shallowRef<number | null>(null)
  const fetchPhoto = fetchContext ?? ((photoId: string) => $fetch<PhotoContext>(`/api/public/photos/${photoId}`))

  const load = async (photoId: string) => {
    loading.value = true
    try {
      context.value = await fetchPhoto(photoId)
    } finally {
      loading.value = false
    }
  }

  const openPhoto = async (photoId: string) => {
    if (import.meta.client) originScrollY.value = window.scrollY
    await load(photoId)
    if (import.meta.client) history.pushState({ photoId }, '', photoUrl(photoId))
  }

  const navigatePhoto = async (photoId: string) => {
    await load(photoId)
    if (import.meta.client) history.replaceState({ photoId }, '', photoUrl(photoId))
  }

  const closePhoto = () => {
    context.value = null
    originScrollY.value = null
    if (!import.meta.client) return
    if (history.state?.photoId) history.back()
    else history.replaceState({}, '', photoUrl())
  }

  const nextPhoto = () => {
    if (!context.value?.siblings.length) return Promise.resolve()
    const index = (context.value.index + 1) % context.value.siblings.length
    return navigatePhoto(context.value.siblings[index]!.id)
  }

  const previousPhoto = () => {
    if (!context.value?.siblings.length) return Promise.resolve()
    const index = (context.value.index - 1 + context.value.siblings.length) % context.value.siblings.length
    return navigatePhoto(context.value.siblings[index]!.id)
  }

  const onPopState = () => {
    const photoId = new URL(window.location.href).searchParams.get('photo')
    if (photoId) void load(photoId)
    else {
      context.value = null
      originScrollY.value = null
    }
  }

  onMounted(() => {
    window.addEventListener('popstate', onPopState)
    const photoId = new URL(window.location.href).searchParams.get('photo')
    if (photoId) void load(photoId)
  })

  onBeforeUnmount(() => window.removeEventListener('popstate', onPopState))

  return {
    context,
    loading,
    originScrollY,
    isOpen: computed(() => context.value !== null),
    openPhoto,
    closePhoto,
    navigatePhoto,
    nextPhoto,
    previousPhoto
  }
}
