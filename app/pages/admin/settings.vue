<script setup lang="ts">
import type { AdminSettings } from '../../../shared/types/admin'
import type { GalleryPhoto } from '~/types/content'
definePageMeta({ layout: 'admin', middleware: 'admin' })
const { data } = await useFetch<AdminSettings & { photos: GalleryPhoto[] }>('/api/admin/settings')
const mode = ref(data.value?.heroMode || 'manual'), photoId = ref(data.value?.heroPhotoId || ''), message = ref(''), error = ref('')
const selected = computed(() => data.value?.photos.find(photo => photo.id === photoId.value))
async function save() { error.value = ''; try { await $fetch('/api/admin/settings', { method: 'PUT', body: { heroMode: mode.value, heroPhotoId: photoId.value || null } }); message.value = '首页封面设置已保存' } catch (cause: any) { error.value = cause.data?.statusMessage || '保存失败' } }
</script>
<template><section><div class="admin-heading"><div><p class="admin-kicker">第一眼的风景</p><h1>首页设置</h1></div></div><form class="admin-settings admin-form" @submit.prevent="save"><fieldset><legend>首屏照片来源</legend><label class="admin-check"><input v-model="mode" type="radio" value="manual">手动选择照片</label><label class="admin-check"><input v-model="mode" type="radio" value="latest">跟随最新发布记录</label></fieldset><label v-if="mode === 'manual'">选择已发布的照片<select v-model="photoId"><option value="">保留上一次有效封面</option><option v-for="photo in data?.photos" :key="photo.id" :value="photo.id">{{ photo.storyTitle }} · {{ photo.caption || photo.image.alt || photo.id }}</option></select></label><img v-if="mode === 'manual' && selected" class="admin-hero-preview" :src="selected.image.src" :alt="selected.image.alt"><p class="admin-description">自动模式使用最新已发布记录的封面。没有可用照片时回退到上一次有效封面。</p><p v-if="message" class="admin-success" role="status">{{ message }}</p><p v-if="error" class="admin-error" role="alert">{{ error }}</p><button class="admin-primary">保存首页设置</button></form></section></template>
