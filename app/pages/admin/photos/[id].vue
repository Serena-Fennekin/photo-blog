<script setup lang="ts">
import type { AdminCategory, AdminPhoto } from '../../../../shared/types/admin'
definePageMeta({ layout: 'admin', middleware: 'admin' })
const id = String(useRoute().params.id), request = useRequestFetch()
const { data: record,pending:loadPending,error:loadError,refresh } = await useAsyncData('edit-photo-' + id, () => request<AdminPhoto>('/api/admin/photos/' + id),{lazy:true})
const photo = ref<AdminPhoto|null>(record.value?structuredClone(toRaw(record.value)):null)
watch(record,value=>{if(value)photo.value=structuredClone(toRaw(value))})
const { data: categories } = await useFetch<AdminCategory[]>('/api/admin/categories',{lazy:true})
const busy = ref(false), error = ref(''), message = ref('')
async function save(status?: 'published' | 'draft') {
  if (busy.value||loadPending.value||loadError.value||!photo.value) return
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
useAdminFeedback(message,error)
</script>
<template>
  <section>
    <NuxtLink class="admin-back" to="/admin">← 所有照片</NuxtLink>
    <UiSkeleton v-if="loadPending" variant="form" label="正在加载照片信息" :count="2"/>
    <UiEmptyState v-else-if="loadError||!photo" art="error" title="这张照片暂未加载。" description="重新加载试试，或返回照片列表查看。"><button class="admin-secondary" @click="refresh()">重新加载照片信息</button></UiEmptyState>
    <template v-else>
    <div class="admin-heading"><div><p class="admin-kicker">{{ photo.status === 'published' ? '已发布的照片' : '照片草稿' }}</p><h1>编辑照片</h1></div><div class="admin-row-actions"><button class="admin-secondary" :disabled="busy" @click="save()">保存照片</button><button v-if="photo.status === 'published'" class="admin-secondary" :disabled="busy" @click="save('draft')">撤回照片</button><button v-else class="admin-primary" :disabled="busy || photo.processingStatus !== 'ready'" @click="save('published')">发布照片</button></div></div>
    <p v-if="error" role="alert" class="admin-error">{{ error }}</p>
    <div class="admin-single-photo">
      <figure class="admin-photo-preview"><img v-if="photo.image" :src="photo.image.src" :alt="photo.image.alt"><p v-else class="admin-error">{{ photo.error || '照片尚未处理完成' }}</p><GalleryExifPanel :exif="photo.exif" /></figure>
      <fieldset class="admin-form" :disabled="busy">
        <label>照片标题<input v-model="photo.title" maxlength="120" placeholder="可留空"></label>
        <div class="admin-form-pair"><label>拍摄日期<input v-model="photo.capturedOn" type="date" required></label><label>地点<input v-model="photo.location" maxlength="120" placeholder="城市或区域"></label></div>
        <label>简短随笔<textarea v-model="photo.note" rows="4" maxlength="1500" placeholder="只为这张照片写几句话，也可以留白。" /></label>
        <label>照片说明<input v-model="photo.caption" maxlength="300"></label>
        <label v-if="photo.image">替代文本<input v-model="photo.image.alt" maxlength="300"></label>
        <fieldset><legend>分类</legend><label v-for="category in categories?.filter(item => item.active)" :key="category.slug" class="admin-check"><input v-model="photo.categorySlugs" type="checkbox" :value="category.slug"><UiCategoryLabel :name="category.name"/></label></fieldset>
      </fieldset>
    </div>
    </template>
  </section>
</template>
