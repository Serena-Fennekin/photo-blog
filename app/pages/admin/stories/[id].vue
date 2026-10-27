<script setup lang="ts">
import type { AdminCategory, AdminStory } from '../../../../shared/types/admin'
definePageMeta({ layout: 'admin', middleware: 'admin' })
const route = useRoute(), request = useRequestFetch()
const id = String(route.params.id)
const { data: record } = await useAsyncData(`edit-${id}`, () => request<AdminStory>(`/api/admin/stories/${id}`))
if (!record.value) throw createError({ statusCode: 404, statusMessage: '记录不存在' })
const story = ref<AdminStory>(structuredClone(toRaw(record.value)))
const { data: categories } = await useFetch<AdminCategory[]>('/api/admin/categories')
const busy = ref(false), uploading = ref(false), message = ref(''), error = ref(''), preview = ref(false)
const fileInput = ref<HTMLInputElement | null>(null), dragIndex = ref<number | null>(null)
const uploads = ref<{ file: File; progress: number; state: string; error?: string }[]>([])
const readyPhotos = computed(() => story.value.photos.filter(photo => photo.status === 'ready' && photo.image))
const payload = () => ({ title: story.value.title, slug: story.value.slug, capturedOn: story.value.capturedOn, location: story.value.location, note: story.value.note, categorySlugs: story.value.categorySlugs, coverPhotoId: story.value.coverPhotoId, status: story.value.status, photos: story.value.photos.map(photo => ({ id: photo.id, alt: photo.image?.alt || '', caption: photo.caption || '' })) })
async function save(status?: 'draft' | 'published') {
  if (busy.value) return false
  busy.value = true; message.value = ''; error.value = ''
  try { story.value = await $fetch<AdminStory>(`/api/admin/stories/${id}`, { method: 'PATCH', body: { ...payload(), ...(status ? { status } : {}) } }); message.value = status === 'published' ? '已发布到网站' : '已保存'; return true }
  catch (cause: any) { error.value = cause.data?.statusMessage || '保存失败，请重新登录后重试'; return false }
  finally { busy.value = false }
}
function uploadFile(item: typeof uploads.value[number]) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `/api/admin/stories/${id}/photos`)
    xhr.setRequestHeader('Content-Type', item.file.type || 'application/octet-stream')
    xhr.setRequestHeader('X-File-Name', encodeURIComponent(item.file.name))
    xhr.upload.onprogress = event => { if (event.lengthComputable) item.progress = Math.round(event.loaded / event.total * 100); item.state = item.progress === 100 ? '正在生成展示图' : '正在上传' }
    xhr.onload = () => { if (xhr.status >= 200 && xhr.status < 300) { story.value = JSON.parse(xhr.responseText); item.state = '完成'; resolve() } else { let reason = '上传失败，可重试'; try { reason = JSON.parse(xhr.responseText).statusMessage || reason } catch {} reject(new Error(reason)) } }
    xhr.onerror = () => reject(new Error('网络中断，请重试'))
    xhr.send(item.file)
  })
}
async function uploadFiles(files: File[]) {
  if (uploading.value || busy.value) return
  if (files.length + story.value.photos.length > 100) { error.value = '每组最多100张，请分组整理'; return }
  uploading.value = true
  if (!await save()) { uploading.value = false; return }
  for (const file of files) uploads.value.push({ file, progress: 0, state: '等待上传' })
  for (const item of uploads.value.filter(item => item.state === '等待上传')) {
    try { if (item.file.size > 25 * 1024 * 1024) throw new Error('单张照片最大25MB'); await uploadFile(item) }
    catch (cause: any) { item.state = '失败'; item.error = cause.message }
  }
  try { story.value = await $fetch<AdminStory>(`/api/admin/stories/${id}`) }
  catch { error.value = '同步失败，请重新登录后刷新；已上传的照片仍会保留。' }
  finally { uploading.value = false; if (fileInput.value) fileInput.value.value = '' }
}
async function retry(photoId: string) {
  busy.value = true; error.value = ''
  try { story.value = await $fetch<AdminStory>(`/api/admin/stories/${id}/photos/${photoId}/retry`, { method: 'POST' }) }
  catch (cause: any) { error.value = cause.data?.statusMessage || '重试失败，请重新选择文件' }
  finally { busy.value = false }
}
async function removePhoto(photoId: string) {
  if (!window.confirm('从这组记录移除照片？原文件仍会保留。')) return
  if (!await save()) return
  busy.value = true
  try { story.value = await $fetch<AdminStory>(`/api/admin/stories/${id}/photos/${photoId}`, { method: 'DELETE' }) }
  catch { error.value = '移除失败，请重新登录后重试' }
  finally { busy.value = false }
}
function move(index: number, next: number) { if (busy.value || uploading.value || next < 0 || next >= story.value.photos.length) return; const [photo] = story.value.photos.splice(index, 1); if (photo) story.value.photos.splice(next, 0, photo) }
function dropPhoto(index: number) { if (dragIndex.value !== null) move(dragIndex.value, index); dragIndex.value = null }
onBeforeRouteLeave(() => { if (uploading.value) return window.confirm('照片正在上传，离开会中断当前上传。确定离开？') })
</script>
<template>
  <section><NuxtLink class="admin-back" to="/admin">← 所有摄影记录</NuxtLink><div class="admin-heading"><div><p class="admin-kicker">{{ story.status === 'published' ? '已发布的记录' : '草稿' }}</p><h1>整理这一刻</h1></div><div class="admin-row-actions"><button class="admin-quiet" @click="preview = !preview">{{ preview ? '继续编辑' : '预览' }}</button><button class="admin-secondary" :disabled="busy || uploading" @click="save()">保存</button><button v-if="story.status === 'published'" class="admin-secondary" :disabled="busy || uploading" @click="save('draft')">撤回为草稿</button><button v-else class="admin-primary" :disabled="busy || uploading || !readyPhotos.length" @click="save('published')">发布记录</button></div></div><p v-if="message" role="status" class="admin-success">{{ message }}</p><p v-if="error" role="alert" class="admin-error">{{ error }}</p>
    <article v-if="preview" class="admin-preview"><p class="admin-meta">{{ story.capturedOn }} / {{ story.location }}</p><h1>{{ story.title }}</h1><p>{{ story.note }}</p><figure v-for="photo in readyPhotos" :key="photo.id"><img :src="photo.image!.src" :alt="photo.image!.alt"><figcaption>{{ photo.caption }}</figcaption></figure></article>
    <fieldset v-else class="admin-editor" :disabled="busy || uploading"><div class="admin-form admin-metadata"><label>标题<input v-model="story.title" maxlength="120" required></label><div class="admin-form-pair"><label>拍摄日期<input v-model="story.capturedOn" type="date" required></label><label>地点<input v-model="story.location" placeholder="手动填写城市或区域" maxlength="120"></label></div><label>简短随笔<textarea v-model="story.note" rows="4" maxlength="1500" placeholder="写几句话，也可以留白。" /></label><label>记录链接<input v-model="story.slug" pattern="[a-z0-9-]+" maxlength="160"><small>小写英文、数字与连字符。</small></label><fieldset><legend>分类</legend><label v-for="category in categories?.filter(item => item.active)" :key="category.slug" class="admin-check"><input v-model="story.categorySlugs" type="checkbox" :value="category.slug">{{ category.name }}</label></fieldset></div>
    <section class="admin-photo-editor"><label class="admin-dropzone" for="batch-photos" @dragover.prevent @drop.prevent="uploadFiles(Array.from($event.dataTransfer?.files || []))"><span>{{ uploading ? '正在上传和处理，请稍等…' : '拖入照片，或点击批量选择' }}</span><small>JPEG / PNG / WebP · 单张不超过25MB · 每组最多100张</small><input id="batch-photos" ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp" multiple :disabled="uploading || busy" @change="uploadFiles(Array.from(($event.target as HTMLInputElement).files || []))"></label><ul v-if="uploads.length" class="admin-upload-list"><li v-for="(upload,index) in uploads" :key="index"><span>{{ upload.file.name }}</span><span>{{ upload.state }} {{ upload.progress ? `${upload.progress}%` : '' }}</span><small v-if="upload.error">{{ upload.error }}</small><button v-if="upload.state === '失败' && !uploading" class="admin-quiet" @click="uploadFiles([upload.file])">重新上传</button></li></ul><p class="admin-meta">拖动照片排序，或使用前移、后移按钮。修改后请保存。</p><div class="admin-photo-grid"><article v-for="(photo,index) in story.photos" :key="photo.id" class="admin-photo-card" :draggable="!uploading && !busy" @dragstart="dragIndex = index" @dragover.prevent @drop.prevent="dropPhoto(index)"><img v-if="photo.image" :src="photo.image.src" :alt="photo.image.alt" loading="lazy" draggable="false"><div v-else class="admin-photo-failed">{{ photo.error || '处理失败' }}<button class="admin-secondary" :disabled="busy || uploading" @click="retry(photo.id)">重试处理</button></div><div class="admin-photo-fields"><label class="admin-check"><input v-model="story.coverPhotoId" type="radio" :value="photo.id" :disabled="photo.status !== 'ready'">组图封面</label><label>照片说明<input v-model="photo.caption" maxlength="300"></label><label v-if="photo.image">替代文本<input v-model="photo.image.alt" maxlength="300"></label><div class="admin-row-actions"><button class="admin-quiet" :disabled="index === 0" @click="move(index,index-1)">前移</button><button class="admin-quiet" :disabled="index === story.photos.length-1" @click="move(index,index+1)">后移</button><button class="admin-quiet" :disabled="busy || uploading" @click="removePhoto(photo.id)">移除</button></div></div></article></div></section></fieldset>
  </section>
</template>
