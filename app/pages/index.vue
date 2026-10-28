<script setup lang="ts">
import type { HomePageModel } from '../../server/services/public-content-service'
import FeaturedPhotos from '~/components/home/FeaturedPhotos.vue'

const { data: home } = await useAsyncData('home-page', () => $fetch<HomePageModel>('/api/public/home'))
const homeRoot = ref<HTMLElement | null>(null)
useHomeAnimations(homeRoot)

if (!home.value) throw createError({ statusCode: 503, statusMessage: '网站暂不可用，请稍后重试' })

useSeoMeta({
  title: 'PHOTO JOURNAL — 留在照片里的日子',
  description: '把生活里的美好记下来，等某天再看，还能回到当时。'
})
</script>

<template>
  <div v-if="home" ref="homeRoot" class="home-page" data-home-motion-root>
    <HomeGalleryInvitation />

    <FeaturedPhotos :photos="home.photos" />

    <section class="home-about" data-home-motion="home-about">
      <p class="eyebrow" data-home-motion="home-about-label">快门之外</p>
      <p data-home-motion="home-about-copy">照片让我回到当时，车轮带我走向下一程。喜欢在停留与出发之间，记下生活细小而真实的模样。</p>
      <NuxtLink class="text-link" to="/about" data-home-motion="home-about-link">了解更多 ↗</NuxtLink>
    </section>
  </div>
</template>
