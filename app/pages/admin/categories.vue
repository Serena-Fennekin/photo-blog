<script setup lang="ts">
import type { AdminCategory } from '../../../shared/types/admin'
definePageMeta({ layout: 'admin', middleware: 'admin' })
const { data: categories, refresh } = await useFetch<AdminCategory[]>('/api/admin/categories')
const name = ref(''), slug = ref(''), error = ref(''), message = ref('')
async function save(category: AdminCategory) {
  error.value = ''; message.value = ''
  try { await $fetch('/api/admin/categories', { method: 'PUT', body: category }); await refresh(); message.value = '分类已保存' } catch (cause: any) { error.value = cause.data?.statusMessage || '保存失败，请重新登录' }
}
async function create() { if (!name.value || !slug.value) return; await save({ name: name.value, slug: slug.value, active: true, position: categories.value?.length || 0 }); if (!error.value) { name.value = ''; slug.value = '' } }
useAdminFeedback(message,error)
</script>
<template><section><div class="admin-heading"><div><p class="admin-kicker">让照片有迹可循</p><h1>分类管理</h1><p class="admin-description">停用后不再显示在摄影集顶部，已有记录仍会保留关联。</p></div></div><p v-if="error" class="admin-error" role="alert">{{ error }}</p><form class="admin-category-new admin-form" @submit.prevent="create"><label>分类名称<input v-model="name" maxlength="40" required placeholder="例如：城市"></label><label>英文标识<input v-model="slug" pattern="[a-z0-9-]+" maxlength="80" required placeholder="例如：city"></label><button class="admin-primary">新增分类</button></form><div class="admin-category-list"><form v-for="category in categories" :key="category.slug" class="admin-category-row admin-form" @submit.prevent="save(category)"><label>名称<input v-model="category.name" maxlength="40" required></label><label>顺序<input v-model.number="category.position" type="number" min="0" max="1000"></label><label class="admin-check"><input v-model="category.active" type="checkbox">启用</label><button class="admin-secondary">保存</button></form></div></section></template>
