<script setup lang="ts">
import type { HomePageModel } from '../../server/services/public-content-service'
import FeaturedPhotos from '~/components/home/FeaturedPhotos.vue'

const { data: home } = await useAsyncData('home-page', () => $fetch<HomePageModel>('/api/public/home'))
const homeRoot = ref<HTMLElement | null>(null)
useHomeAnimations(homeRoot)

if (!home.value) throw createError({ statusCode: 503, statusMessage: '网站暂不可用，请稍后重试' })

useSeoMeta({
  title: 'PHOTO JOURNAL — 随手拍下的日常',
  description: '花草、小动物，还有散步时看到的风景。一个放日常照片的小相册。'
})
</script>

<template>
  <div v-if="home" ref="homeRoot" class="home-page" data-home-motion-root>
    <div data-home-motion="hero">
      <HomeHero :photo="home.settings.heroPhoto" />
    </div>

    <HomeGalleryInvitation />

    <FeaturedPhotos :photos="home.photos" />

    <section class="home-about" data-home-motion="home-about">
      <p class="eyebrow" data-home-motion="home-about-label">拍照的人</p>
      <p data-home-motion="home-about-copy">平时喜欢拍拍花草、小动物，也拍些散步时看到的风景。这里放的，就是这些小记录。</p>
      <NuxtLink class="text-link" to="/about" data-home-motion="home-about-link">了解更多 ↗</NuxtLink>
    </section>
  </div>
</template>
