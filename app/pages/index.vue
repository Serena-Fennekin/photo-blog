<script setup lang="ts">
const homeRoot = ref<HTMLElement | null>(null)
const { data: copy } = await useSiteCopy()
useHomeAnimations(homeRoot)

useSeoMeta({
  title: 'PHOTO JOURNAL — 留在照片里的日子',
  description: '把生活里的美好记下来，等某天再看，还能回到当时。'
})
</script>

<template>
  <div ref="homeRoot" class="home-page" data-home-motion-root>
    <HomeGalleryInvitation :quote="copy.homeQuote" :link-label="copy.homeLinkLabel" />
  </div>
</template>
