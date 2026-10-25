<script setup lang="ts">
import type { HomePageModel } from '../../server/services/public-content-service'

const { data: home } = await useAsyncData('home-page', () => $fetch<HomePageModel>('/api/public/home'))

if (!home.value?.settings.heroPhoto) {
  throw createError({ statusCode: 503, statusMessage: '首页照片暂不可用' })
}

useSeoMeta({
  title: 'PHOTO JOURNAL — 光与时间的记录',
  description: '一册关于城市、山野与日常光线的个人摄影日志。'
})
</script>

<template>
  <div v-if="home" class="home-page">
    <HomeHero :photo="home.settings.heroPhoto!" />

    <section class="home-page__chapters" aria-label="最近摄影记录">
      <TimeChapter v-for="story in home.stories" :key="story.id" :story="story" />
    </section>

    <GalleryInvitation />

    <section class="home-about">
      <p class="eyebrow">BEHIND THE CAMERA</p>
      <p>拍照是我与时间相处的方式。这里没有宏大的主题，只有反复经过的街道、天气与人。</p>
      <NuxtLink class="text-link" to="/about">了解更多 ↗</NuxtLink>
    </section>
  </div>
</template>
