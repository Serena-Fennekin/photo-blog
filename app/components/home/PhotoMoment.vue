<script setup lang="ts">
import type { GalleryPhoto } from '~/types/content'
defineProps<{ photo: GalleryPhoto }>()
</script>
<template>
  <article class="photo-moment">
    <header class="photo-moment__header">
      <div>
        <p class="photo-moment__date" data-home-motion="chapter-date">{{ photo.capturedOn.replaceAll('-', '.') }}</p>
        <p v-if="photo.location" class="photo-moment__location">{{ photo.location }}</p>
      </div>
      <div class="photo-moment__copy" data-home-motion="chapter-copy">
        <p class="eyebrow">A MOMENT IN LIGHT</p>
        <h2 v-if="photo.title">{{ photo.title }}</h2>
        <p v-if="photo.note" class="photo-moment__note">{{ photo.note }}</p>
        <NuxtLink class="text-link" :to="{ path: '/gallery', query: { photo: photo.id } }">在摄影集中查看 ↗</NuxtLink>
      </div>
    </header>
    <figure class="photo-moment__photo" data-home-motion="chapter-primary-photo">
      <NuxtLink :to="{ path: '/gallery', query: { photo: photo.id } }" :aria-label="'查看照片：' + photo.image.alt">
        <img :src="photo.image.src" :srcset="photo.image.srcset" sizes="(max-width: 760px) 92vw, 72vw" :width="photo.image.width" :height="photo.image.height" :alt="photo.image.alt" loading="lazy">
      </NuxtLink>
      <figcaption v-if="photo.caption && photo.caption !== photo.title">{{ photo.caption }}</figcaption>
    </figure>
  </article>
</template>
