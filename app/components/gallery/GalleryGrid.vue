<script setup lang="ts">
import GalleryCard from './GalleryCard.vue'

import type { GalleryPhoto } from '~/types/content'

withDefaults(defineProps<{ items: GalleryPhoto[]; interactive?: boolean }>(), {
  interactive: true
})
const emit = defineEmits<{ select: [photoId: string] }>()
</script>

<template>
  <div v-if="items.length" class="gallery-grid">
    <GalleryCard
      v-for="photo in items"
      :key="photo.id"
      :photo="photo"
      :interactive="interactive"
      @select="emit('select', $event)"
    />
  </div>
  <div v-else class="gallery-empty" role="status">
    <p>暂时没有照片。</p>
    <p>换一个分类看看，或者过些时候再来。</p>
  </div>
</template>
