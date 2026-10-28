<script setup lang="ts">
import { postTopics } from '#shared/notebook'
import type { AdminPost, PostImage } from '../../../shared/types/notebook'
const props = defineProps<{ postId?: string }>()
const { data: existing, error: loadError } = props.postId ? await useFetch<AdminPost>(`/api/admin/posts/${props.postId}`) : { data: ref<AdminPost | null>(null), error: ref(null) }
const form = reactive({ title: existing.value?.title ?? '', body: existing.value?.body ?? '', topic: existing.value?.topic ?? 'life', visibility: existing.value?.visibility ?? 'public' })
const images = ref<PostImage[]>(existing.value?.images ?? []), busy = ref(false), uploading = ref(false), error = ref(''), message = ref(useRoute().query.saved ? '动态已保存' : '')
async function upload(event: Event) {
  const input = event.target as HTMLInputElement, files = Array.from(input.files || []), remaining = 9 - images.value.length
  error.value = ''; uploading.value = true
  if (files.length > remaining) error.value = `最多9张图片，本次仅添加前${remaining}张`
  for (const file of files.slice(0, remaining)) {
    try {
      if (file.size > 25 * 1024 * 1024) throw new Error('单张图片最大25MB')
      const asset = await $fetch<PostImage>('/api/admin/post-media', { method: 'POST', body: file, headers: { 'x-file-name': encodeURIComponent(file.name), 'content-type': file.type || 'application/octet-stream' } })
      images.value.push(asset)
    } catch (cause: any) { error.value = `${file.name}：${cause.data?.statusMessage || cause.message || '上传失败，请重试'}` }
  }
  input.value = ''; uploading.value = false
}
async function save(status: 'draft' | 'published') {
  busy.value = true; error.value = ''; message.value = ''
  try {
    const result = await $fetch<AdminPost>(props.postId ? `/api/admin/posts/${props.postId}` : '/api/admin/posts', { method: props.postId ? 'PUT' : 'POST', body: { ...form, imageIds: images.value.map(image => image.id), status } })
    if (!props.postId) await navigateTo(`/admin/posts/${result.id}?saved=1`)
    else message.value = status === 'draft' ? '草稿已保存，不会在前台展示' : form.visibility === 'private' ? '动态已保存，仅在后台可见' : '动态已保存，已在关于我公开展示'
  } catch (cause: any) { error.value = cause.data?.statusMessage || '保存失败，请检查正文或图片并重试' }
  finally { busy.value = false }
}
</script>
<template><section><NuxtLink class="admin-back" to="/admin/posts">← 所有动态</NuxtLink><div class="admin-heading"><div><h1>{{ postId ? '编辑动态' : '写一条动态' }}</h1><p class="admin-description">不用写成一篇文章。几句话、几张图片，也是一条记录。</p></div></div><p v-if="loadError" role="alert" class="admin-error">动态加载失败，请返回列表重试。</p><form v-else class="admin-form admin-notebook-editor" @submit.prevent="save('published')"><fieldset :disabled="busy || uploading"><label>标题（可选）<input v-model="form.title" maxlength="120" placeholder="给今天起个名字，也可以留空"></label><label>正文<textarea v-model="form.body" rows="12" maxlength="10000" placeholder="今天发生了什么，想到了什么……支持换行、表情和纯文字。"></textarea></label><div class="admin-post-images"><div v-for="(asset, index) in images" :key="asset.id" data-post-upload><img :src="asset.image.src" alt="动态配图预览"><button type="button" :aria-label="`移除第${index + 1}张图片`" @click="images.splice(index, 1)">×</button></div></div><label class="admin-post-upload">添加动态图片<input aria-label="添加动态图片" type="file" accept="image/jpeg,image/png,image/webp" multiple :disabled="images.length >= 9" @change="upload"><small>{{ images.length }} / 9 张 · JPEG、PNG、WebP · 每张最大25MB，图片不会加入摄影集</small></label></fieldset><aside class="admin-post-publish"><label>话题<select v-model="form.topic" :disabled="busy || uploading"><option v-for="(label, topic) in postTopics" :key="topic" :value="topic">{{ label }}</option></select></label><label>可见范围<select v-model="form.visibility" :disabled="busy || uploading"><option value="public">公开 · 所有人可见</option><option value="private">私密 · 仅后台可见</option></select></label><p class="admin-description">{{ form.visibility === 'private' ? '正文和配图均不会出现在公开页面。即使知道图片地址，也需要管理员登录才能查看。' : '发布后展示在“关于我”的动态墙，访客可以浏览文字和配图。' }}</p><button class="admin-primary" :disabled="busy || uploading">{{ uploading ? '正在处理图片…' : busy ? '正在保存…' : form.visibility === 'private' ? '保存私密动态' : '发布动态' }}</button><button class="admin-secondary" type="button" :disabled="busy || uploading" @click="save('draft')">保存草稿</button><p v-if="message" class="admin-success" role="status">{{ message }}</p><p v-if="error" class="admin-error" role="alert">{{ error }}</p></aside></form></section></template>
