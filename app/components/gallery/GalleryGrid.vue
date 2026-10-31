<script setup lang="ts">
import GalleryCard from './GalleryCard.vue'
import EmptyState from '../ui/EmptyState.vue'

import type { GalleryPhoto } from '~/types/content'

withDefaults(defineProps<{ items: GalleryPhoto[]; interactive?: boolean;filtered?:boolean }>(), {
  interactive: true,filtered:false
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
  <EmptyState v-else class="gallery-empty" art="photos" title="暂时没有照片。" :description="filtered?'换一个分类看看，或者过些时候再来。':'摄影集正在慢慢整理，先去看看照片之外的日常吧。'"><NuxtLink :to="filtered?'/gallery':'/about'" class="admin-secondary">{{ filtered?'查看全部照片':'看看近况' }}</NuxtLink></EmptyState>
</template>
