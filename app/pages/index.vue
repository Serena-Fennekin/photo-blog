<script setup lang="ts">
import type { HomePageModel } from '../../server/services/public-content-service'

const { data: home } = await useAsyncData('home-page', () => $fetch<HomePageModel>('/api/public/home'))
const homeRoot = ref<HTMLElement | null>(null)
useHomeAnimations(homeRoot)

if (!home.value) throw createError({ statusCode: 503, statusMessage: '网站暂不可用，请稍后重试' })

useSeoMeta({
  title: 'PHOTO JOURNAL — 光与时间的记录',
  description: '一册关于城市、山野与日常光线的个人摄影日志。'
})
</script>

<template>
  <div v-if="home" ref="homeRoot" class="home-page" data-home-motion-root>
    <div data-home-motion="hero">
      <HomeHero :photo="home.settings.heroPhoto" />
    </div>

    <section class="home-page__chapters" aria-label="最近摄影记录">
      <div v-for="story in home.stories" :key="story.id" data-home-motion="chapter">
        <HomeTimeChapter :story="story" />
      </div>
    </section>

    <HomeGalleryInvitation />

    <section class="home-about" data-home-motion="home-about">
      <p class="eyebrow" data-home-motion="home-about-label">BEHIND THE CAMERA</p>
      <p data-home-motion="home-about-copy">拍照是我与时间相处的方式。这里没有宏大的主题，只有反复经过的街道、天气与人。</p>
      <NuxtLink class="text-link" to="/about" data-home-motion="home-about-link">了解更多 ↗</NuxtLink>
    </section>
  </div>
</template>
