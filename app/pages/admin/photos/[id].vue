<script setup lang="ts">
import type { AdminCategory, AdminPhoto } from '../../../../shared/types/admin'
definePageMeta({ layout: 'admin', middleware: 'admin' })
const id = String(useRoute().params.id), request = useRequestFetch()
const { data: record } = await useAsyncData('edit-photo-' + id, () => request<AdminPhoto>('/api/admin/photos/' + id))
if (!record.value) throw createError({ statusCode: 404, statusMessage: '照片不存在' })
const photo = ref<AdminPhoto>(structuredClone(toRaw(record.value)))
const { data: categories } = await useFetch<AdminCategory[]>('/api/admin/categories')
const busy = ref(false), error = ref(''), message = ref('')
async function save(status?: 'published' | 'draft') {
  if (busy.value) return
  busy.value = true; error.value = ''; message.value = ''
  try {
    const current = photo.value
    photo.value = await $fetch<AdminPhoto>('/api/admin/photos/' + id, { method: 'PATCH', body: {
      title: current.title, capturedOn: current.capturedOn, location: current.location, note: current.note, caption: current.caption,
      categorySlugs: current.categorySlugs, ...(current.image ? { alt: current.image.alt } : {}), ...(status ? { status } : {})
    } })
    message.value = status === 'published' ? '这张照片已发布' : status === 'draft' ? '这张照片已撤回' : '照片已保存'
  } catch (cause: any) { error.value = cause.data?.statusMessage || '保存失败，请重试' }
  finally { busy.value = false }
}
</script>
<template>
  <section>
    <NuxtLink class="admin-back" to="/admin">← 所有照片</NuxtLink>
    <div class="admin-heading"><div><p class="admin-kicker">{{ photo.status === 'published' ? '已发布的照片' : '照片草稿' }}</p><h1>编辑照片</h1></div><div class="admin-row-actions"><button class="admin-secondary" :disabled="busy" @click="save()">保存照片</button><button v-if="photo.status === 'published'" class="admin-secondary" :disabled="busy" @click="save('draft')">撤回照片</button><button v-else class="admin-primary" :disabled="busy || photo.processingStatus !== 'ready'" @click="save('published')">发布照片</button></div></div>
    <p v-if="error" role="alert" class="admin-error">{{ error }}</p><p v-if="message" role="status" class="admin-success">{{ message }}</p>
    <div class="admin-single-photo">
      <figure class="admin-photo-preview"><img v-if="photo.image" :src="photo.image.src" :alt="photo.image.alt"><p v-else class="admin-error">{{ photo.error || '照片尚未处理完成' }}</p><GalleryExifPanel :exif="photo.exif" /></figure>
      <fieldset class="admin-form" :disabled="busy">
        <label>照片标题<input v-model="photo.title" maxlength="120" placeholder="可留空"></label>
        <div class="admin-form-pair"><label>拍摄日期<input v-model="photo.capturedOn" type="date" required></label><label>地点<input v-model="photo.location" maxlength="120" placeholder="城市或区域"></label></div>
        <label>简短随笔<textarea v-model="photo.note" rows="4" maxlength="1500" placeholder="只为这张照片写几句话，也可以留白。" /></label>
        <label>照片说明<input v-model="photo.caption" maxlength="300"></label>
        <label v-if="photo.image">替代文本<input v-model="photo.image.alt" maxlength="300"></label>
        <fieldset><legend>分类</legend><label v-for="category in categories?.filter(item => item.active)" :key="category.slug" class="admin-check"><input v-model="photo.categorySlugs" type="checkbox" :value="category.slug">{{ category.name }}</label></fieldset>
      </fieldset>
    </div>
  </section>
</template>
