<script setup lang="ts">
import type { GalleryPage } from '~/types/content'
import { mergeGalleryItems } from '~/utils/gallery'

const route = useRoute()
const lightbox = usePhotoLightbox()
const lightboxOpen = lightbox.isOpen
const lightboxContext = lightbox.context
const lightboxOriginScrollY = lightbox.originScrollY
const galleryReady = ref(false)
const activeCategory = computed(() => typeof route.query.category === 'string' ? route.query.category : undefined)
const requestKey = computed(() => `gallery:${activeCategory.value ?? 'all'}`)

const { data, pending, error: loadError, refresh } = await useAsyncData(
  requestKey,
  () => $fetch<GalleryPage>('/api/public/gallery', {
    query: { ...(activeCategory.value ? { category: activeCategory.value } : {}), limit: 24 }
  }),
  { lazy:true, watch: [activeCategory] }
)

const items = ref(data.value?.items ?? [])
const nextCursor = ref(data.value?.nextCursor ?? null)
const loadingMore = ref(false)
const moreError=ref('')
const categories=ref(data.value?.categories??[])
let generation=0
watch(activeCategory,()=>{generation++;items.value=[];nextCursor.value=null;loadingMore.value=false;moreError.value=''})

watch(data, (page) => {
  items.value = page?.items ?? []
  nextCursor.value = page?.nextCursor ?? null
  if(page)categories.value=page.categories
})

onMounted(() => {
  galleryReady.value = true
})

const loadMore = async () => {
  if (!nextCursor.value || loadingMore.value) return
  loadingMore.value = true
  moreError.value=''
  const currentGeneration=generation,category=activeCategory.value,cursor=nextCursor.value
  try {
    const page = await $fetch<GalleryPage>('/api/public/gallery', {
      query: {
        ...(category ? { category } : {}),
        cursor,
        limit: 24
      }
    })
    if(currentGeneration!==generation)return
    items.value = mergeGalleryItems(items.value, page.items)
    nextCursor.value = page.nextCursor
  } catch {
    if(currentGeneration===generation)moreError.value='照片没有加载出来，可以再试一次。'
  } finally {
    if(currentGeneration===generation)loadingMore.value = false
  }
}

useSeoMeta({
  title: '摄影集 — PHOTO JOURNAL',
  description: '按主题浏览全部公开照片。'
})
</script>

<template>
  <div class="gallery-page">
    <header class="gallery-heading">
      <div>
        <p class="eyebrow">THE ARCHIVE</p>
        <h1>摄影集</h1>
      </div>
      <p>每一张照片，都留着一段可以重返的日常。选择一个主题，或只是向下慢慢观看。</p>
    </header>

    <GalleryCategoryFilter
      :categories="categories"
      :active-category="activeCategory"
    />

    <UiSkeleton v-if="pending && !items.length" variant="gallery" label="正在加载照片" :count="6"/>
    <UiEmptyState v-else-if="loadError && !items.length" art="error" title="照片暂时没有加载出来。" description="连接可能有些慢，重新加载即可继续观看。"><button class="admin-secondary" @click="refresh()">重新加载照片</button></UiEmptyState>
    <GalleryGrid v-else :items="items" :interactive="galleryReady" @select="lightbox.openPhoto" />

    <UiSkeleton v-if="loadingMore" variant="gallery" label="正在加载更多照片" :count="3"/>
    <div v-if="nextCursor" class="gallery-more">
      <p v-if="moreError" role="alert">{{ moreError }}</p>
      <button type="button" :disabled="loadingMore" @click="loadMore">
        {{ loadingMore ? '正在加载…' : '加载更多' }}
      </button>
    </div>

    <GalleryPhotoLightbox
      :open="lightboxOpen"
      :context="lightboxContext"
      :origin-scroll-y="lightboxOriginScrollY"
      @close="lightbox.closePhoto"
      @navigate="lightbox.navigatePhoto"
    />
  </div>
</template>
