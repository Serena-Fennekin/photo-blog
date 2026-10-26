<script setup lang="ts">
import type { StoryDetail } from '~/types/content'

const route = useRoute()
const slug = computed(() => String(route.params.slug))
const { data: story } = await useAsyncData(
  () => `story:${slug.value}`,
  () => $fetch<StoryDetail>(`/api/public/stories/${slug.value}`),
  { watch: [slug] }
)

if (!story.value) throw createError({ statusCode: 404, statusMessage: '这组摄影记录不存在' })

const lightbox = usePhotoLightbox()
const lightboxOpen = lightbox.isOpen
const lightboxContext = lightbox.context
const lightboxOriginScrollY = lightbox.originScrollY
const storyReady = ref(false)

onMounted(() => {
  storyReady.value = true
})

useSeoMeta({
  title: () => `${story.value?.title ?? '摄影记录'} — PHOTO JOURNAL`,
  description: () => story.value?.note ?? '一组个人摄影记录。'
})
</script>

<template>
  <article v-if="story" class="story-page">
    <StoryHeader :story="story" />
    <StorySequence :story="story" :interactive="storyReady" @select="lightbox.openPhoto" />
    <nav class="story-page__ending" aria-label="摄影记录末尾导航">
      <p>这一组记录，到这里。</p>
      <NuxtLink class="text-link" to="/gallery">回到摄影集</NuxtLink>
    </nav>
    <GalleryPhotoLightbox
      :open="lightboxOpen"
      :context="lightboxContext"
      :origin-scroll-y="lightboxOriginScrollY"
      @close="lightbox.closePhoto"
      @navigate="lightbox.navigatePhoto"
    />
  </article>
</template>
