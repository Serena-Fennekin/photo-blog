<script setup lang="ts">
import { computed } from 'vue'

import type { GalleryPhoto } from '~/types/content'
import { gridSrcset } from '~/utils/gallery'

const props = withDefaults(defineProps<{ photo: GalleryPhoto; interactive?: boolean }>(), {
  interactive: true
})
const emit = defineEmits<{ select: [photoId: string] }>()
const cardRatio = computed(() => `${props.photo.image.width} / ${props.photo.image.height}`)
const cardSrcset = computed(() => gridSrcset(props.photo.image.srcset))
</script>

<template>
  <button
    class="gallery-card"
    type="button"
    :disabled="!interactive"
    :data-photo-id="photo.id"
    :style="{ aspectRatio: cardRatio }"
    :aria-label="`查看照片：${photo.image.alt}`"
    @click="emit('select', photo.id)"
  >
    <img
      :src="photo.image.src"
      :srcset="cardSrcset"
      sizes="(max-width: 680px) 94vw, (max-width: 1100px) 48vw, 32vw"
      :width="photo.image.width"
      :height="photo.image.height"
      :alt="photo.image.alt"
      loading="lazy"
    >
    <span class="gallery-card__caption">
      <span>{{ photo.storyTitle }}</span>
      <span>{{ photo.viewCount }} 次查看<span v-if="photo.exif.camera"> · {{ photo.exif.camera }}</span></span>
    </span>
  </button>
</template>
