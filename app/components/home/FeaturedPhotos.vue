<script setup lang="ts">
import type { GalleryPhoto } from '~/types/content'
import { computed } from 'vue'
const props = defineProps<{ photos: GalleryPhoto[] }>()
const columns = computed(() => {
  const middle = Math.ceil(props.photos.length / 2)
  return [props.photos.slice(0, middle), props.photos.slice(middle)].filter(column => column.length)
})
</script>

<template>
  <section v-if="photos.length" class="home-featured" aria-labelledby="featured-title">
    <header class="home-featured__heading">
      <h2 id="featured-title">留在照片里的日子</h2>
      <p>把生活里的美好记下来，等某天再看，还能回到当时。</p>
    </header>
    <div class="home-featured__grid" :class="{ 'home-featured__grid--single': photos.length === 1 }">
      <div v-for="(column, index) in columns" :key="index" class="home-featured__column">
        <figure v-for="photo in column" :key="photo.id" class="home-featured__photo" :data-featured-photo-id="photo.id" data-home-motion="featured-photo">
          <NuxtLink :to="{ path: '/gallery', query: { photo: photo.id } }" :aria-label="'在摄影集中查看：' + (photo.caption || photo.image.alt || photo.title)">
            <img :src="photo.image.src" :srcset="photo.image.srcset" sizes="(max-width: 760px) 88vw, (max-width: 1200px) 44vw, 520px" :width="photo.image.width" :height="photo.image.height" :alt="photo.image.alt" loading="lazy">
          </NuxtLink>
          <figcaption v-if="photo.caption">{{ photo.caption }}</figcaption>
        </figure>
      </div>
    </div>
    <NuxtLink class="text-link" to="/gallery">看全部照片 ↗</NuxtLink>
  </section>
</template>
