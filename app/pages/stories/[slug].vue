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

await navigateTo({ path: '/gallery', query: { photo: story.value.cover.id } }, { replace: true, redirectCode: 302 })
</script>

<template>
  <p role="status">正在打开摄影集…</p>
</template>
