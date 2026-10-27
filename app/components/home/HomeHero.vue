<script setup lang="ts">
import { formatCaptureTime } from '~/utils/capture-time'
import type { GalleryPhoto } from '~/types/content'

defineProps<{ photo: GalleryPhoto | null }>()
</script>

<template>
  <section class="home-hero" aria-labelledby="hero-title">
    <div class="home-hero__copy" data-home-motion="hero-copy">
      <p class="eyebrow">PHOTOGRAPHIC JOURNAL · HANGZHOU</p>
      <h1 id="hero-title">日常，经过光之后</h1>
      <p class="home-hero__lede">记录在城市与山野之间，偶然停留的目光。</p>
    </div>

    <figure class="home-hero__frame" data-home-motion="hero-image">
      <img
        v-if="photo"
        :src="photo.image.src"
        :srcset="photo.image.srcset"
        sizes="(max-width: 760px) 88vw, 48vw"
        :width="photo.image.width"
        :height="photo.image.height"
        :alt="photo.image.alt"
        fetchpriority="high"
      >
      <div v-else class="home-hero__empty">等待下一次快门。</div>
      <figcaption v-if="photo">
        <span>{{ photo.storyTitle }}</span>
        <span>{{ formatCaptureTime(photo.exif.capturedAt)?.slice(0, 10).replaceAll('-', '.') }}</span>
      </figcaption>
    </figure>

    <p class="home-hero__index" aria-hidden="true">01 — LIGHT / TIME</p>
  </section>
</template>
