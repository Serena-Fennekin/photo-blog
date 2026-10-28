<script setup lang="ts">
import { formatCaptureTime } from '~/utils/capture-time'
import type { GalleryPhoto } from '~/types/content'

defineProps<{ photo: GalleryPhoto | null }>()
</script>

<template>
  <section class="home-hero" aria-labelledby="hero-title">
    <div class="home-hero__copy" data-home-motion="hero-copy">
      <h1 id="hero-title">看见喜欢的，<br>就拍下来。</h1>
      <p class="home-hero__lede">路边的花草、偶遇的小动物，<br>还有散步时看到的风景。</p>
    </div>

    <figure class="home-hero__frame" data-home-motion="hero-image">
      <NuxtLink v-if="photo" class="home-hero__photo-link" :to="{ path: '/gallery', query: { photo: photo.id } }" :aria-label="'查看照片：' + photo.image.alt">
        <img
        :src="photo.image.src"
        :srcset="photo.image.srcset"
        sizes="(max-width: 760px) 88vw, 70vw"
        :width="photo.image.width"
        :height="photo.image.height"
        :alt="photo.image.alt"
        fetchpriority="high"
        >
      </NuxtLink>
      <div v-else class="home-hero__empty">照片还在整理中。</div>
      <figcaption>
        <span v-if="photo">{{ (formatCaptureTime(photo.exif.capturedAt)?.slice(0, 10) || photo.capturedOn).replaceAll('-', '.') }}</span>
        <a href="#home-intro">往下看看 ↓</a>
      </figcaption>
    </figure>

  </section>
</template>
