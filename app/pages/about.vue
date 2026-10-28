<script setup lang="ts">
import type { PostImage, PostPage, PublicPost } from '../../shared/types/notebook'
const { data: copy } = await useSiteCopy()
const { data: feed, error: loadError, refresh } = await useFetch<PostPage>('/api/public/posts', { default: () => ({ items: [], nextCursor: null }) })
const loadingMore = ref(false), moreError = ref(''), selected = ref<{ images: PostImage[]; index: number } | null>(null)
const paragraphs = computed(() => copy.value.aboutBody.split(/\n\s*\n/).filter(Boolean))
const readable = useReadingVisibility()
async function more() {
  if (!feed.value.nextCursor || loadingMore.value) return
  loadingMore.value = true; moreError.value = ''
  try {
    const next = await $fetch<PostPage>('/api/public/posts', { query: { cursor: feed.value.nextCursor } })
    const known = new Set(feed.value.items.map(post => post.id))
    feed.value = { items: [...feed.value.items, ...next.items.filter(post => !known.has(post.id))], nextCursor: next.nextCursor }
  } catch { moreError.value = '加载失败，可以再试一次。' }
  finally { loadingMore.value = false }
}
function showImages(post: PublicPost, index: number) { selected.value = { images: post.images, index } }
useSeoMeta({
  title: '关于我 — PHOTO JOURNAL',
  description: '关于这册个人摄影日志，以及我观看日常的方式。'
})
</script>

<template>
  <article class="about-page about-page--feed">
    <header class="about-page__header">
      <h1>{{ copy.aboutTitle }}</h1>
      <p class="about-page__statement">{{ copy.aboutStatement }}</p>
    </header>
    <div class="about-notebook-layout">
      <aside class="about-profile"><div class="about-profile__identity"><span class="profile-avatar" aria-hidden="true">{{ copy.authorName.slice(0,1) }}</span><div><h2>{{ copy.authorName }}</h2><p>{{ copy.authorTagline }}</p></div></div><div class="about-page__body"><p v-for="(paragraph, index) in paragraphs" :key="index">{{ paragraph }}</p></div></aside>
      <section class="moments-feed" aria-labelledby="moments-title"><header class="moments-feed__heading"><div><h2 id="moments-title">近况与记录</h2><p>照片之外，也有一些想留下的话。</p></div><span class="moments-feed__dot" aria-hidden="true"></span></header>
        <div v-if="loadError" class="moments-empty" role="alert"><p>动态暂时没有加载出来。</p><button class="admin-secondary" @click="refresh()">重新加载</button></div>
        <template v-else><NotebookMomentCard v-for="post in feed.items" :key="post.id" :post="post" :author="copy.authorName" :readable="readable" @images="showImages" /><div v-if="!feed.items.length" class="moments-empty"><svg viewBox="0 0 64 64" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="12" y="8" width="40" height="48" rx="7"/><path d="M22 22h20M22 31h20M22 40h12"/></svg><h3>留一处地方，给正在发生的生活。</h3><p>新的记录，会慢慢写在这里。</p></div><button v-if="feed.nextCursor" class="moments-more" :disabled="loadingMore" @click="more">{{ loadingMore ? '正在翻阅…' : '看看更早的记录' }}</button><p v-if="moreError" role="alert">{{ moreError }}</p></template>
      </section>
    </div>
    <NotebookImageViewer v-if="selected" :images="selected.images" :initial-index="selected.index" @close="selected = null" />
  </article>
</template>
