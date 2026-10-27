<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, type PropType } from 'vue'

import type { PhotoContext } from '~/types/content'
import ExifPanel from './ExifPanel.vue'

const props = defineProps({
  open: { type: Boolean, required: true },
  context: { type: Object as PropType<PhotoContext | null>, default: null },
  originScrollY: { type: Number as PropType<number | null>, default: null }
})
const emit = defineEmits<{ close: []; navigate: [photoId: string] }>()

const dialog = ref<HTMLElement | null>(null)
const closeButton = ref<HTMLButtonElement | null>(null)
const displayedViews = ref(0)
let countedPhoto: string | null = null
let touchStart: { x: number; y: number } | null = null
async function recordVisiblePhoto(event?: Event) {
  if (typeof window === 'undefined' || !props.open || !props.context) return
  const image = event?.target instanceof HTMLImageElement ? event.target : dialog.value?.querySelector('figure img') as HTMLImageElement | undefined
  const id = props.context?.photo.id
  if (!props.open || !id || !image || !image.complete || !image.naturalWidth || document.visibilityState === 'hidden' || countedPhoto === id || typeof $fetch === 'undefined') return
  if (image.dataset.lightboxPhotoId !== id) return
  countedPhoto = id
  try { const result = await $fetch<{ total: number }>(`/api/public/photos/${id}/view`, { method: 'POST' }); if (props.context?.photo.id === id) displayedViews.value = result.total } catch { /* Viewing is independent of the optional counter. */ }
}
function startTouch(event: TouchEvent) { const point = event.changedTouches[0]; touchStart = point ? { x: point.clientX, y: point.clientY } : null }
function endTouch(event: TouchEvent) {
  const point = event.changedTouches[0]
  if (point && touchStart) { const dx = point.clientX - touchStart.x, dy = point.clientY - touchStart.y; if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) navigate(dx < 0 ? nextId.value : previousId.value) }
  touchStart = null
}
let previousFocus: HTMLElement | null = null
let previousOverflow = ''
let previousPosition = ''
let previousTop = ''
let previousWidth = ''
let previousScrollY = 0
let stopOpenWatch: (() => void) | undefined

const previousId = computed(() => {
  if (!props.context?.siblings.length) return null
  const index = (props.context.index - 1 + props.context.siblings.length) % props.context.siblings.length
  return props.context.siblings[index]?.id ?? null
})

const nextId = computed(() => {
  if (!props.context?.siblings.length) return null
  const index = (props.context.index + 1) % props.context.siblings.length
  return props.context.siblings[index]?.id ?? null
})

const navigate = (photoId: string | null) => {
  if (photoId) emit('navigate', photoId)
}

const prefetchAdjacent = () => {
  if (!props.open || !props.context || typeof Image === 'undefined') return
  const ids = new Set([previousId.value, nextId.value])
  for (const id of ids) {
    const photo = props.context.siblings.find(item => item.id === id)
    if (!photo) continue
    const image = new Image()
    image.src = photo.image.src
  }
}

const focusableElements = () => Array.from(
  dialog.value?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])') ?? []
)

const onKeydown = (event: KeyboardEvent) => {
  if (!props.open) return
  if (event.key === 'Escape') {
    event.preventDefault()
    emit('close')
    return
  }
  if (event.key === 'ArrowRight') {
    event.preventDefault()
    navigate(nextId.value)
    return
  }
  if (event.key === 'ArrowLeft') {
    event.preventDefault()
    navigate(previousId.value)
    return
  }
  if (event.key !== 'Tab') return

  const focusable = focusableElements()
  if (!focusable.length) return
  const first = focusable[0]!
  const last = focusable.at(-1)!
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

const activate = async () => {
  previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
  previousOverflow = document.body.style.overflow
  previousPosition = document.body.style.position
  previousTop = document.body.style.top
  previousWidth = document.body.style.width
  previousScrollY = props.originScrollY ?? window.scrollY
  document.body.style.overflow = 'hidden'
  document.body.style.position = 'fixed'
  document.body.style.top = `-${previousScrollY}px`
  document.body.style.width = '100%'
  window.addEventListener('keydown', onKeydown)
  await nextTick()
  closeButton.value?.focus()
  prefetchAdjacent()
}

const deactivate = () => {
  window.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = previousOverflow
  document.body.style.position = previousPosition
  document.body.style.top = previousTop
  document.body.style.width = previousWidth
  window.scrollTo(0, previousScrollY)
  previousFocus?.focus({ preventScroll: true })
  previousFocus = null
}

onMounted(() => {
  document.addEventListener('visibilitychange', recordVisiblePhoto)
  stopOpenWatch = watch(
    () => props.open,
    isOpen => isOpen ? activate() : deactivate(),
    { immediate: true }
  )
})

watch(() => props.context?.photo.id, async () => {
  displayedViews.value = props.context?.photo.viewCount ?? 0
  countedPhoto = null
  prefetchAdjacent()
  await nextTick()
  void recordVisiblePhoto()
}, { immediate: true })

onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', recordVisiblePhoto)
  stopOpenWatch?.()
  if (props.open) deactivate()
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open && context"
      ref="dialog"
      class="photo-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="照片详情"
      :data-active-photo-id="context.photo.id"
    >
      <button ref="closeButton" class="photo-lightbox__close" type="button" data-action="close" @click="emit('close')">
        关闭 <span aria-hidden="true">×</span>
      </button>

      <div class="photo-lightbox__stage">
        <button type="button" class="photo-lightbox__nav is-previous" data-action="previous" aria-label="上一张" @click="navigate(previousId)">←</button>
        <figure @touchstart.passive="startTouch" @touchend.passive="endTouch">
          <img
            :src="context.photo.image.src"
            :srcset="context.photo.image.srcset"
            sizes="(max-width: 760px) 96vw, 72vw"
            :width="context.photo.image.width"
            :height="context.photo.image.height"
            :alt="context.photo.image.alt"
            :data-lightbox-photo-id="context.photo.id"
            @load="recordVisiblePhoto"
          >
        </figure>
        <button type="button" class="photo-lightbox__nav is-next" data-action="next" aria-label="下一张" @click="navigate(nextId)">→</button>
      </div>

      <aside class="photo-lightbox__details">
        <div>
          <p class="eyebrow">{{ String(context.index + 1).padStart(2, '0') }} / {{ String(context.siblings.length).padStart(2, '0') }}</p>
          <h2>{{ context.photo.storyTitle }}</h2>
          <p v-if="context.photo.caption" class="photo-lightbox__caption">{{ context.photo.caption }}</p>
        </div>
        <ExifPanel :exif="context.photo.exif" />
        <p class="photo-lightbox__views">{{ displayedViews }} 次查看</p>
      </aside>
    </div>
  </Teleport>
</template>
