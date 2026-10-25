<script setup lang="ts">
import type { GalleryPage } from '~/types/content'
import { mergeGalleryItems } from '~/utils/gallery'

const route = useRoute()
const activeCategory = computed(() => typeof route.query.category === 'string' ? route.query.category : undefined)
const requestKey = computed(() => `gallery:${activeCategory.value ?? 'all'}`)

const { data, pending } = await useAsyncData(
  requestKey,
  () => $fetch<GalleryPage>('/api/public/gallery', {
    query: { ...(activeCategory.value ? { category: activeCategory.value } : {}), limit: 24 }
  }),
  { watch: [activeCategory] }
)

const items = ref(data.value?.items ?? [])
const nextCursor = ref(data.value?.nextCursor ?? null)
const loadingMore = ref(false)

watch(data, (page) => {
  items.value = page?.items ?? []
  nextCursor.value = page?.nextCursor ?? null
})

const loadMore = async () => {
  if (!nextCursor.value || loadingMore.value) return
  loadingMore.value = true
  try {
    const page = await $fetch<GalleryPage>('/api/public/gallery', {
      query: {
        ...(activeCategory.value ? { category: activeCategory.value } : {}),
        cursor: nextCursor.value,
        limit: 24
      }
    })
    items.value = mergeGalleryItems(items.value, page.items)
    nextCursor.value = page.nextCursor
  } finally {
    loadingMore.value = false
  }
}

useSeoMeta({
  title: '摄影集 — PHOTO JOURNAL',
  description: '按主题浏览全部公开摄影记录。'
})
</script>

<template>
  <div class="gallery-page">
    <header class="gallery-heading">
      <div>
        <p class="eyebrow">THE ARCHIVE</p>
        <h1>摄影集</h1>
      </div>
      <p>照片从不同记录中汇在这里。选择一个主题，或只是向下慢慢观看。</p>
    </header>

    <CategoryFilter
      :categories="data?.categories ?? []"
      :active-category="activeCategory"
    />

    <p v-if="pending && !items.length" class="gallery-loading" role="status">正在显影…</p>
    <GalleryGrid v-else :items="items" />

    <div v-if="nextCursor" class="gallery-more">
      <button type="button" :disabled="loadingMore" @click="loadMore">
        {{ loadingMore ? '正在加载…' : '加载更多' }}
      </button>
    </div>
  </div>
</template>
