<script setup lang="ts">
import type { AdminCategory, AdminPhoto, BulkPhotoResult } from '../../../shared/types/admin'
definePageMeta({ layout: 'admin', middleware: 'admin' })
const { data: photos, refresh } = await useFetch<AdminPhoto[]>('/api/admin/photos')
const { data: categories } = await useFetch<AdminCategory[]>('/api/admin/categories')
const selected = ref<string[]>([]), busy = ref(false), uploading = ref(false), error = ref(''), message = ref(''), bulkCategory = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const uploads = ref<{ file: File; state: string; progress: number; error?: string; existingPhoto?: Pick<AdminPhoto, 'id' | 'title' | 'status'> }[]>([])
const dragId = ref<string | null>(null)
onMounted(() => { void refresh() })
const selectable = computed(() => photos.value?.filter(photo => photo.processingStatus === 'ready').map(photo => photo.id) ?? [])
const allSelected = computed(() => selectable.value.length > 0 && selectable.value.every(id => selected.value.includes(id)))
function selectAll() { selected.value = allSelected.value ? [] : [...selectable.value] }
function uploadOne(item: typeof uploads.value[number]) {
  return new Promise<AdminPhoto>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/api/admin/photos')
    xhr.setRequestHeader('Content-Type', 'application/octet-stream')
    xhr.setRequestHeader('X-File-Name', encodeURIComponent(item.file.name))
    xhr.upload.onprogress = event => { if (event.lengthComputable) item.progress = Math.round(event.loaded / event.total * 100) }
    xhr.upload.onload = () => { item.state = '处理中' }
    xhr.onerror = () => reject(new Error('网络中断，请重新上传'))
    xhr.onload = () => {
      let result: any
      try { result = JSON.parse(xhr.responseText) } catch {}
      if (xhr.status >= 200 && xhr.status < 300) resolve(result)
      else reject(Object.assign(new Error(result?.statusMessage || '上传失败，请重试'), { existingPhoto: result?.data?.existingPhoto }))
    }
    xhr.send(item.file)
  })
}
async function uploadFiles(files: File[]) {
  if (uploading.value || busy.value || !files.length) return
  if (files.length > 100) { error.value = '一次最多上传100张，请分批选择'; return }
  uploading.value = true; error.value = ''; message.value = ''; selected.value = []
  uploads.value = files.map(file => ({ file, state: '等待上传', progress: 0 }))
  const newIds: string[] = []
  try {
    for (const item of uploads.value) {
      try { item.state = '上传中'; const photo = await uploadOne(item); newIds.push(photo.id); item.state = '完成' }
      catch (cause: any) { item.existingPhoto = cause.existingPhoto; item.state = item.existingPhoto ? '已存在' : '失败'; item.error = cause instanceof Error ? cause.message : '上传失败' }
      await refresh()
    }
    if (newIds.length) {
      const ids = [...newIds, ...(photos.value ?? []).filter(photo => !newIds.includes(photo.id)).map(photo => photo.id)]
      await $fetch('/api/admin/photos/order', { method: 'PUT', body: { ids } })
      selected.value = newIds
    }
    const duplicates = uploads.value.filter(item => item.existingPhoto).length
    const failed = uploads.value.filter(item => item.state === '失败').length
    message.value = [newIds.length ? '已上传 ' + newIds.length + ' 张独立照片。选择发布后会出现在摄影集中。' : '', duplicates ? '已跳过 ' + duplicates + ' 张重复照片。' : '', failed ? failed + ' 张上传失败，请查看下方原因。' : ''].filter(Boolean).join(' ')
  } catch (cause: any) { error.value = cause.data?.statusMessage || '照片已保留，请刷新后检查顺序' }
  finally { uploading.value = false; if (fileInput.value) fileInput.value.value = ''; await refresh() }
}
async function apply(changes: Record<string, unknown>, ids = selected.value) {
  if (busy.value || uploading.value || !ids.length) return
  if (changes.status === 'deleted' && !window.confirm('移除选中的照片？原始文件仍保留在本地。')) return
  busy.value = true; error.value = ''; message.value = ''
  try {
    const result = await $fetch<BulkPhotoResult>('/api/admin/photos/bulk', { method: 'POST', body: { ids, changes } })
    message.value = changes.status === 'published'
      ? result.alreadyPublished === ids.length ? '所选 ' + ids.length + ' 张照片均已发布，已跳过重复发布。' : '已发布 ' + (ids.length - result.alreadyPublished) + ' 张照片' + (result.alreadyPublished ? '；另有 ' + result.alreadyPublished + ' 张已发布，已跳过重复发布。' : '')
      : '已更新 ' + ids.length + ' 张照片'
    if (changes.status === 'deleted') selected.value = selected.value.filter(id => !ids.includes(id))
    await refresh()
  } catch (cause: any) { error.value = cause.data?.statusMessage || '操作失败，请刷新后重试' }
  finally { busy.value = false }
}
async function retry(id: string) {
  if (busy.value || uploading.value) return
  busy.value = true; error.value = ''
  try { await $fetch('/api/admin/photos/' + id + '/retry', { method: 'POST' }); await refresh() }
  catch (cause: any) { error.value = cause.data?.statusMessage || '处理失败，请重新上传原始照片' }
  finally { busy.value = false }
}
async function move(from: number, to: number) {
  if (busy.value || uploading.value || !photos.value || to < 0 || to >= photos.value.length || from === to) return
  const ordered = [...photos.value], [photo] = ordered.splice(from, 1)
  if (!photo) return
  ordered.splice(to, 0, photo); busy.value = true; error.value = ''
  try { photos.value = await $fetch<AdminPhoto[]>('/api/admin/photos/order', { method: 'PUT', body: { ids: ordered.map(photo => photo.id) } }) }
  catch (cause: any) { error.value = cause.data?.statusMessage || '排序失败，请刷新后重试' }
  finally { busy.value = false }
}
function drop(index: number) { const from = photos.value?.findIndex(photo => photo.id === dragId.value) ?? -1; dragId.value = null; if (from >= 0) void move(from, index) }
</script>
<template>
  <section>
    <div class="admin-heading"><div><p class="admin-kicker">你的影像档案</p><h1>照片管理</h1><p class="admin-description">每张照片独立整理。一次可以上传多张，随后分别编辑或多选发布。</p></div></div>
    <p v-if="error" role="alert" class="admin-error">{{ error }}</p><p v-if="message" role="status" class="admin-success">{{ message }}</p>
    <div class="admin-stats"><span><strong>{{ photos?.length || 0 }}</strong> 张照片</span><span><strong>{{ photos?.filter(photo => photo.status === 'published').length || 0 }}</strong> 已发布</span><span><strong>{{ photos?.filter(photo => photo.status === 'draft').length || 0 }}</strong> 草稿</span></div>
    <label class="admin-dropzone" for="batch-photos" @dragover.prevent @drop.prevent="uploadFiles(Array.from($event.dataTransfer?.files || []))">
      <span>{{ uploading ? '正在逐张上传和处理…' : '拖入照片，或点击批量选择' }}</span><small>JPEG / PNG / WebP · 单张最大25MB · 每次最多选择100张</small>
      <input id="batch-photos" ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp" multiple :disabled="uploading || busy" @change="uploadFiles(Array.from(($event.target as HTMLInputElement).files || []))">
    </label>
    <ul v-if="uploads.length" class="admin-upload-list"><li v-for="(item,index) in uploads" :key="index"><span>{{ item.file.name }}</span><span>{{ item.state }} {{ item.progress ? item.progress + '%' : '' }}</span><small v-if="item.error">{{ item.error }}</small><NuxtLink v-if="item.existingPhoto" :to="'/admin/photos/' + item.existingPhoto.id">查看已有照片：{{ item.existingPhoto.title }}（{{ item.existingPhoto.status === 'published' ? '已发布' : '草稿' }}）</NuxtLink><button v-if="item.state === '失败' && !uploading" class="admin-quiet" :disabled="busy" @click="uploadFiles([item.file])">重新上传</button></li></ul>
    <fieldset class="admin-library-controls" :disabled="busy || uploading">
      <label class="admin-check"><input type="checkbox" :checked="allSelected" @change="selectAll">全选可用照片</label><span class="admin-meta">已选 {{ selected.length }} 张</span>
      <button class="admin-primary" :disabled="!selected.length" @click="apply({ status: 'published' })">发布所选</button><button class="admin-secondary" :disabled="!selected.length" @click="apply({ status: 'draft' })">撤回所选</button>
      <label class="admin-bulk-category">统一分类<select v-model="bulkCategory"><option value="">选择分类</option><option v-for="category in categories?.filter(item => item.active)" :key="category.slug" :value="category.slug">{{ category.name }}</option></select></label>
      <button class="admin-secondary" :disabled="!selected.length || !bulkCategory" @click="apply({ categorySlugs: [bulkCategory] })">应用所选分类</button><button class="admin-quiet" :disabled="!selected.length" @click="apply({ status: 'deleted' })">移除所选</button>
    </fieldset>
    <p class="admin-meta">拖动卡片或使用前移、后移调整整个摄影集的顺序。</p>
    <fieldset class="admin-photo-grid admin-photo-library" :disabled="busy || uploading">
      <article v-for="(photo,index) in photos" :key="photo.id" class="admin-photo-card" :data-admin-photo-id="photo.id" :draggable="!busy && !uploading" @dragstart="dragId=photo.id" @dragover.prevent @drop.prevent="drop(index)">
        <img v-if="photo.image" :src="photo.image.src" :alt="photo.image.alt" loading="lazy" draggable="false">
        <div v-else class="admin-photo-failed">{{ photo.error || '图片处理失败' }}<button class="admin-secondary" @click="retry(photo.id)">重试处理</button></div>
        <div class="admin-photo-fields">
          <label class="admin-check"><input v-model="selected" type="checkbox" :value="photo.id" :disabled="photo.processingStatus !== 'ready'" :aria-label="'选择照片：' + (photo.title || photo.id)">{{ photo.status === 'published' ? '已发布' : '草稿' }}</label>
          <h2>{{ photo.title || '未命名照片' }}</h2><p class="admin-meta">{{ photo.capturedOn }}<span v-if="photo.location"> · {{ photo.location }}</span></p>
          <div class="admin-row-actions"><button class="admin-secondary" @click="navigateTo('/admin/photos/' + photo.id)">编辑</button><a v-if="photo.status === 'published'" :href="'/gallery?photo=' + photo.id" target="_blank" rel="noopener">查看 ↗</a><button class="admin-quiet" @click="apply({status:'deleted'},[photo.id])">移除</button></div>
          <div class="admin-row-actions"><button class="admin-quiet" :disabled="index === 0" @click="move(index,index-1)">前移</button><button class="admin-quiet" :disabled="index === (photos?.length || 0)-1" @click="move(index,index+1)">后移</button></div>
        </div>
      </article>
    </fieldset>
    <p v-if="!photos?.length" class="admin-empty">这里还很安静。直接选择照片，开始第一次上传。</p>
  </section>
</template>
