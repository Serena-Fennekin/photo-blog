<script setup lang="ts">
import type { AdminStory } from '../../../shared/types/admin'
definePageMeta({ layout: 'admin', middleware: 'admin' })
const { data: stories, refresh } = await useFetch<AdminStory[]>('/api/admin/stories')
const busy = ref(false), error = ref('')
async function createStory() {
  busy.value = true
  try { const story = await $fetch<AdminStory>('/api/admin/stories', { method: 'POST', body: { title: '新的摄影记录', capturedOn: new Date().toISOString().slice(0, 10) } }); await navigateTo(`/admin/stories/${story.id}`) }
  catch { error.value = '创建失败，请刷新页面或重新登录' }
  finally { busy.value = false }
}
async function remove(story: AdminStory) {
  if (!window.confirm(`将“${story.title}”移入回收状态？照片原文件会保留。`)) return
  try { await $fetch(`/api/admin/stories/${story.id}`, { method: 'DELETE' }); await refresh() } catch { error.value = '删除失败，请重新登录后重试' }
}
</script>
<template>
  <section><div class="admin-heading"><div><p class="admin-kicker">你的影像档案</p><h1>摄影记录</h1><p class="admin-description">每一次出发，整理成一组值得慢慢看的照片。</p></div><button class="admin-primary" :disabled="busy" @click="createStory">＋ 新建记录</button></div><p v-if="error" role="alert" class="admin-error">{{ error }}</p><div class="admin-stats"><span><strong>{{ stories?.filter(item => item.status === 'published').length || 0 }}</strong> 已发布</span><span><strong>{{ stories?.filter(item => item.status === 'draft').length || 0 }}</strong> 草稿</span><span><strong>{{ stories?.reduce((count, story) => count + story.photos.length, 0) || 0 }}</strong> 张照片</span></div><div class="admin-story-list"><article v-for="story in stories" :key="story.id" class="admin-story-row"><NuxtLink :to="`/admin/stories/${story.id}`" class="admin-story-cover"><img v-if="story.photos.find(photo => photo.id === story.coverPhotoId)?.image" :src="story.photos.find(photo => photo.id === story.coverPhotoId)!.image!.src" alt="" loading="lazy"><span v-else>尚未上传</span></NuxtLink><div><p class="admin-meta">{{ story.capturedOn }} · {{ story.status === 'published' ? '已发布' : '草稿' }}</p><h2><NuxtLink :to="`/admin/stories/${story.id}`">{{ story.title }}</NuxtLink></h2><p class="admin-meta">{{ story.photos.length }} 张照片<span v-if="story.location"> · {{ story.location }}</span></p></div><div class="admin-row-actions"><NuxtLink :to="`/admin/stories/${story.id}`">编辑</NuxtLink><NuxtLink v-if="story.status === 'published'" :to="`/stories/${story.slug}`" target="_blank">查看 ↗</NuxtLink><button class="admin-quiet" @click="remove(story)">移除</button></div></article></div><p v-if="!stories?.length" class="admin-empty">这里还很安静。新建第一组摄影记录吧。</p></section>
</template>
