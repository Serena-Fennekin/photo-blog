<script setup lang="ts">
import GalleryCard from './GalleryCard.vue'
import EmptyState from '../ui/EmptyState.vue'

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
  <EmptyState v-else class="gallery-empty" art="photos" title="暂时没有照片。" description="换一个分类看看，或者过些时候再来。"><NuxtLink to="/gallery" class="admin-secondary">查看全部照片</NuxtLink></EmptyState>
</template>
