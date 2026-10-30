<script setup lang="ts">
import type { AdminSettings } from '../../../shared/types/admin'
import type { GalleryPhoto } from '~/types/content'
import type { SiteCopy } from '../../../shared/types/notebook'
import { defaultSiteCopy } from '#shared/notebook'
definePageMeta({ layout: 'admin', middleware: 'admin' })
const { data } = await useFetch<AdminSettings & { photos: GalleryPhoto[] }>('/api/admin/settings',{lazy:true})
const message = ref(''), error = ref(''), saving = ref(false)
const featuredIds = ref((data.value?.featuredPhotoIds ?? []).filter(id => data.value?.photos.some(photo => photo.id === id)))
watch(data,value=>{if(value)featuredIds.value=(value.featuredPhotoIds??[]).filter(id=>value.photos.some(photo=>photo.id===id))})
const { data: storedCopy, pending:copyPending,error: copyLoadError, refresh: reloadCopy } = await useFetch<SiteCopy>('/api/admin/site-content',{lazy:true})
const copy = reactive<SiteCopy>({ ...defaultSiteCopy, ...storedCopy.value })
const copyReady = computed(() => Boolean(storedCopy.value && !copyLoadError.value && !copyPending.value))
watch(storedCopy, value => { if (value) Object.assign(copy, value) })
const copyMessage = ref(''), copyError = ref(''), copySaving = ref(false)
const avatarUploading=ref(false)
async function uploadAvatar(event:Event){
  const input=event.target as HTMLInputElement,file=input.files?.[0]
  if(!file)return
  avatarUploading.value=true;copyError.value=''
  try{
    if(file.size>5*1024*1024)throw new Error('头像图片最大5MB')
    const result=await $fetch<{avatar:string}>('/api/admin/profile-avatar',{method:'POST',body:file,headers:{'content-type':file.type||'application/octet-stream'}})
    copy.authorAvatar=result.avatar
  }catch(cause:any){copyError.value=cause.data?.statusMessage||cause.message||'头像上传失败，请重试'}
  finally{avatarUploading.value=false;input.value=''}
}
async function saveCopy() {
  if (!copyReady.value||avatarUploading.value) return
  copySaving.value = true; copyError.value = ''; copyMessage.value = ''
  try { Object.assign(copy,await $fetch<SiteCopy>('/api/admin/site-content', { method: 'PUT', body: copy })); await refreshNuxtData('site-copy'); copyMessage.value = '网站文案已保存，头像与名称已同步' }
  catch (cause: any) { copyError.value = cause.data?.statusMessage || '保存失败，请重试' }
  finally { copySaving.value = false }
}
async function save() {
  error.value = ''; message.value = ''; saving.value = true
  try { await $fetch('/api/admin/settings', { method: 'PUT', body: { featuredPhotoIds: featuredIds.value } }); message.value = '首页设置已保存' }
  catch (cause: any) { error.value = cause.data?.statusMessage || '保存失败' }
  finally { saving.value = false }
}
useAdminFeedback(message,error)
useAdminFeedback(copyMessage,copyError)
</script>
<template>
  <section>
    <div class="admin-heading"><div><h1>文案设置</h1><p class="admin-description">首页的引言、关于我的介绍，都可以在这里慢慢调整。换行会保留，输入内容按纯文字展示。</p></div></div>
    <div v-if="copyLoadError"><p role="alert" class="admin-error">文案加载失败。为避免覆盖已保存的内容，编辑和保存已暂停。</p><button type="button" class="admin-secondary" @click="reloadCopy()">重新加载文案</button></div>
    <UiSkeleton v-if="copyPending" variant="form" label="正在加载网站文案" :count="2"/><form v-else class="admin-form admin-copy-editor" @submit.prevent="saveCopy"><fieldset :disabled="copySaving || avatarUploading || !copyReady"><legend>首页</legend><label>首页引言<textarea v-model="copy.homeQuote" rows="4" maxlength="400" required></textarea></label><label>摄影集入口文字<input v-model="copy.homeLinkLabel" maxlength="24" required></label></fieldset><fieldset :disabled="copySaving || avatarUploading || !copyReady"><legend>关于我</legend><label>页面标题<input v-model="copy.aboutTitle" maxlength="40" required></label><label>个人签句<textarea v-model="copy.aboutStatement" rows="3" maxlength="200"></textarea></label><div class="admin-avatar-setting"><span class="admin-avatar-preview"><img v-if="copy.authorAvatar" :src="copy.authorAvatar" alt="作者头像预览"><span v-else>{{ Array.from(copy.authorName)[0]||'摄' }}</span></span><div><strong>作者头像</strong><p>侧栏与每条动态共用，保存后生效。</p><label class="admin-avatar-upload admin-secondary">选择头像<input aria-label="上传作者头像" type="file" accept="image/jpeg,image/png,image/webp" :disabled="avatarUploading" @change="uploadAvatar"></label><button v-if="copy.authorAvatar" type="button" class="admin-quiet" @click="copy.authorAvatar=''">使用文字头像</button><small>{{ avatarUploading?'正在处理头像…':'JPEG、PNG、WebP · 最大5MB' }}</small></div></div><label>作者名称<input v-model="copy.authorName" maxlength="40" required></label><label>一句简介<input v-model="copy.authorTagline" maxlength="160"></label><label>关于我的介绍<textarea v-model="copy.aboutBody" rows="10" maxlength="4000"></textarea><small>空一行分段；生活动态请到“动态”栏目单独发布。</small></label></fieldset><p v-if="copyError" role="alert" class="admin-error">{{ copyError }}</p><button class="admin-primary" :disabled="copySaving || avatarUploading || !copyReady">{{ copySaving ? '正在保存…' : '保存网站文案' }}</button></form>
    <details class="admin-legacy-settings"><summary>旧版精选设置（当前首页不展示）</summary>
    <form class="admin-settings admin-form" @submit.prevent="save">
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
      <p v-if="error" class="admin-error" role="alert">{{ error }}</p>
      <button class="admin-primary" :disabled="saving">{{ saving ? '正在保存…' : '保存首页设置' }}</button>
    </form>
    </details>
  </section>
</template>
