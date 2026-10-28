<script setup lang="ts">
import type { GalleryPhoto } from '~/types/content'
defineProps<{ photos: GalleryPhoto[] }>()
</script>

<template>
  <section v-if="photos.length" class="home-featured" aria-labelledby="featured-title">
    <header class="home-featured__heading">
      <h2 id="featured-title">随手挑了几张</h2>
      <p>花草、小动物，还有路上遇见的风景。</p>
    </header>
    <div class="home-featured__grid">
      <figure v-for="photo in photos" :key="photo.id" class="home-featured__photo" :data-featured-photo-id="photo.id" data-home-motion="featured-photo">
        <NuxtLink :to="{ path: '/gallery', query: { photo: photo.id } }" :aria-label="'在摄影集中查看：' + (photo.caption || photo.image.alt || photo.title)">
          <img :src="photo.image.src" :srcset="photo.image.srcset" sizes="(max-width: 760px) 88vw, (max-width: 1200px) 44vw, 520px" :width="photo.image.width" :height="photo.image.height" :alt="photo.image.alt" loading="lazy">
        </NuxtLink>
        <figcaption v-if="photo.caption">{{ photo.caption }}</figcaption>
      </figure>
    </div>
    <NuxtLink class="text-link" to="/gallery">看全部照片 ↗</NuxtLink>
  </section>
</template>
