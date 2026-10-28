<script setup lang="ts">
import type { AdminSettings } from '../../../shared/types/admin'
import type { GalleryPhoto } from '~/types/content'
definePageMeta({ layout: 'admin', middleware: 'admin' })
const { data } = await useFetch<AdminSettings & { photos: GalleryPhoto[] }>('/api/admin/settings')
const mode = ref(data.value?.heroMode || 'manual'), photoId = ref(data.value?.heroPhotoId || ''), message = ref(''), error = ref(''), saving = ref(false)
const featuredIds = ref((data.value?.featuredPhotoIds ?? []).filter(id => data.value?.photos.some(photo => photo.id === id)))
const selected = computed(() => data.value?.photos.find(photo => photo.id === photoId.value))
async function save() {
  error.value = ''; message.value = ''; saving.value = true
  try { await $fetch('/api/admin/settings', { method: 'PUT', body: { heroMode: mode.value, heroPhotoId: photoId.value || null, featuredPhotoIds: featuredIds.value } }); message.value = '首页设置已保存' }
  catch (cause: any) { error.value = cause.data?.statusMessage || '保存失败' }
  finally { saving.value = false }
}
</script>
<template>
  <section>
    <div class="admin-heading"><div><h1>首页设置</h1><p class="admin-description">选择首屏照片，再挑几张放在首页下方。摄影集仍展示全部已发布照片。</p></div></div>
    <form class="admin-settings admin-form" @submit.prevent="save">
      <fieldset :disabled="saving"><legend>首屏照片来源</legend><label class="admin-check"><input v-model="mode" type="radio" value="manual">手动选择照片</label><label class="admin-check"><input v-model="mode" type="radio" value="latest">跟随最新发布照片</label></fieldset>
      <label v-if="mode === 'manual'">选择已发布的照片<select v-model="photoId" :disabled="saving"><option value="">保留上一次有效主图</option><option v-for="photo in data?.photos" :key="photo.id" :value="photo.id">{{ photo.title }}</option></select></label>
      <img v-if="mode === 'manual' && selected" class="admin-hero-preview" :src="selected.image.src" :alt="selected.image.alt">
      <p class="admin-description">自动模式使用最新发布的照片；所选照片不可用时，回退到其他已发布照片。</p>
      <fieldset :disabled="saving" class="admin-featured"><legend>首页精选（最多6张）</legend>
        <p class="admin-description">已选 {{ featuredIds.length }} / 6 张。未勾选时，默认展示摄影集排序最前的4张；撤回或移除的照片不会展示。</p>
        <div class="admin-featured-grid">
          <label v-for="photo in data?.photos" :key="photo.id" class="admin-featured-option">
            <input v-model="featuredIds" type="checkbox" :value="photo.id" :disabled="featuredIds.length >= 6 && !featuredIds.includes(photo.id)">
            <img :src="photo.image.src" alt="" loading="lazy"><span>{{ photo.title }}</span>
          </label>
        </div>
        <p v-if="!data?.photos.length" class="admin-description">先发布照片，就能在这里挑选首页精选。</p>
      </fieldset>
      <p v-if="message" class="admin-success" role="status">{{ message }}</p><p v-if="error" class="admin-error" role="alert">{{ error }}</p>
      <button class="admin-primary" :disabled="saving">{{ saving ? '正在保存…' : '保存首页设置' }}</button>
    </form>
  </section>
</template>
