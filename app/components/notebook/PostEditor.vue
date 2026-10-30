<script setup lang="ts">
import { postTopics } from '#shared/notebook'
import type { AdminPost, PostImage } from '../../../shared/types/notebook'
const props = defineProps<{ postId?: string }>()
const { data: existing, error: loadError } = props.postId ? await useFetch<AdminPost>(`/api/admin/posts/${props.postId}`) : { data: ref<AdminPost | null>(null), error: ref(null) }
const {data:topics,error:topicError}=await useFetch<Record<string,string>>('/api/admin/post-topics',{default:()=>({...postTopics})})
const form = reactive({ title: existing.value?.title ?? '', body: existing.value?.body ?? '', topic: existing.value?.topic ?? 'life', visibility: existing.value?.visibility ?? 'public' })
const options=computed(()=>({...topics.value,...(existing.value?{[existing.value.topic]:existing.value.topicLabel||existing.value.topic}:{})}))
const images = ref<PostImage[]>(existing.value?.images ?? []), busy = ref(false), uploading = ref(false), error = ref('')
const newTopic=ref(''), addingTopic=ref(false), creatingTopic=ref(false)
const notices=useAdminNotice()
watch(error,value=>{if(value)notices.show(value,'error')})
async function createTopic(){
  if(creatingTopic.value||!newTopic.value.trim())return
  creatingTopic.value=true;error.value=''
  try{
    const topic=await $fetch<{id:string;label:string}>('/api/admin/post-topics',{method:'POST',body:{label:newTopic.value}})
    topics.value={...topics.value,[topic.id]:topic.label};form.topic=topic.id
    newTopic.value='';addingTopic.value=false;notices.show('话题已添加')
  }catch(cause:any){error.value=cause.data?.statusMessage||'话题添加失败，请重试'}
  finally{creatingTopic.value=false}
}
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
  if(busy.value||uploading.value||creatingTopic.value)return
  busy.value = true; error.value = ''
  try {
    const result = await $fetch<AdminPost>(props.postId ? `/api/admin/posts/${props.postId}` : '/api/admin/posts', { method: props.postId ? 'PUT' : 'POST', body: { ...form, imageIds: images.value.map(image => image.id), status } })
    if(status==='published'){
      const message=form.visibility==='private'?'动态已保存，仅在后台可见':'动态已保存，已在关于我公开展示'
      await refreshNuxtData('admin-posts');await navigateTo('/admin/posts');notices.show(message)
    }else{
      if(!props.postId)await navigateTo(`/admin/posts/${result.id}`)
      notices.show('草稿已保存，不会在前台展示')
    }
  } catch (cause: any) { error.value = cause.data?.statusMessage || '保存失败，请检查正文或图片并重试' }
  finally { busy.value = false }
}
</script>
<template>
  <section>
    <NuxtLink class="admin-back" to="/admin/posts">← 所有动态</NuxtLink>
    <div class="admin-heading"><div><h1>{{ postId ? '编辑动态' : '写一条动态' }}</h1><p class="admin-description">不用写成一篇文章。几句话、几张图片，也是一条记录。</p></div></div>
    <p v-if="loadError" role="alert" class="admin-error">动态加载失败，请返回列表重试。</p>
    <form v-else class="admin-form admin-notebook-editor" @submit.prevent="save('published')">
      <fieldset :disabled="busy || uploading">
        <label>标题（可选）<input v-model="form.title" maxlength="120" placeholder="给今天起个名字，也可以留空"></label>
        <label>正文<textarea v-model="form.body" rows="12" maxlength="10000" placeholder="今天发生了什么，想到了什么……支持换行、表情和纯文字。"></textarea></label>
        <div v-if="images.length" class="admin-post-images"><div v-for="(asset, index) in images" :key="asset.id" data-post-upload><img :src="asset.image.src" alt="动态配图预览"><button type="button" :aria-label="`移除第${index + 1}张图片`" @click="images.splice(index, 1)"><UiIcon name="close"/></button></div></div>
        <label class="admin-post-upload admin-upload-tile"><UiIcon name="image"/><strong>{{ uploading?'正在处理图片…':'添加动态图片' }}</strong><span>点选照片，记录这一刻的样子</span><input aria-label="添加动态图片" type="file" accept="image/jpeg,image/png,image/webp" multiple :disabled="images.length >= 9" @change="upload"><small>{{ images.length }} / 9 张 · 每张最大25MB · JPEG、PNG、WebP</small></label>
      </fieldset>
      <aside class="admin-post-publish">
        <div class="admin-publish-heading">发布设置<span>文字与照片，都是日常</span></div>
        <label>话题<select v-model="form.topic" aria-label="话题" :disabled="busy || uploading || creatingTopic"><option v-for="(label, topic) in options" :key="topic" :value="topic">{{ label }}</option></select></label>
        <button v-if="!addingTopic" class="admin-quiet admin-add-topic" type="button" :disabled="busy||uploading" @click="addingTopic=true"><UiIcon name="plus"/>添加话题</button>
        <div v-else class="admin-topic-create" role="group" aria-label="添加新话题"><label>新话题名称<input v-model="newTopic" maxlength="24" :disabled="creatingTopic" @keydown.enter.prevent="createTopic"></label><div class="admin-row-actions"><button class="admin-secondary" type="button" :disabled="creatingTopic||!newTopic.trim()" @click="createTopic">确认添加</button><button class="admin-quiet" type="button" :disabled="creatingTopic" @click="addingTopic=false">取消</button></div></div>
        <p v-if="topicError" class="admin-meta">话题列表暂未加载，可继续使用当前话题。</p>
        <label>可见范围<select v-model="form.visibility" aria-label="可见范围" :disabled="busy || uploading"><option value="public">公开 · 所有人可见</option><option value="private">私密 · 仅后台可见</option></select></label>
        <p class="admin-description">{{ form.visibility === 'private' ? '正文和配图仅自己可见。公开之前，这些记录只留在你的工作台。' : '发布后展示在“关于我”，让来访的人一起翻阅这些日常。' }}</p>
        <button class="admin-primary" :disabled="busy || uploading || creatingTopic">{{ uploading ? '正在处理图片…' : busy ? '正在保存…' : form.visibility === 'private' ? '保存私密动态' : '发布动态' }}</button>
        <button class="admin-secondary" type="button" :disabled="busy || uploading || creatingTopic" @click="save('draft')">保存草稿</button>
        <p v-if="error" class="admin-error" role="alert">{{ error }}</p>
      </aside>
    </form>
  </section>
</template>
