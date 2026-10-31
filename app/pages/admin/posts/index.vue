<script setup lang="ts">
import { topicLabel } from '#shared/notebook'
import type { AdminPost } from '../../../../shared/types/notebook'
definePageMeta({ layout: 'admin', middleware: 'admin' })
const { data: posts,pending:loadPending, refresh, error: loadError } = await useFetch<AdminPost[]>('/api/admin/posts',{key:'admin-posts',lazy:true})
const message = ref(''), error = ref(''), pendingDelete = ref(''), busy = ref(false)
async function remove(id: string) {
  busy.value = true; error.value = ''
  try { await $fetch(`/api/admin/posts/${id}`, { method: 'DELETE' }); pendingDelete.value = ''; await refresh(); message.value = '动态已移除，公开页面与配图入口已关闭' }
  catch { error.value = '移除失败，请重试' }
  finally { busy.value = false }
}
useAdminFeedback(message,error)
</script>
<template>
<section>
  <div class="admin-heading"><div><h1>动态</h1><p class="admin-description">照片之外，也记下一些想说的话。公开动态展示在“关于我”，私密动态仅在这里保留。</p></div><NuxtLink to="/admin/posts/new" class="admin-primary"><UiIcon name="plus"/>写一条动态</NuxtLink></div>
  <p v-if="error" role="alert" class="admin-error">{{ error }}</p>
  <UiSkeleton v-if="loadPending&&!posts" variant="list" label="正在加载动态档案"/>
  <UiEmptyState v-else-if="loadError" art="error" title="动态档案暂未加载。" description="重新加载，继续整理自己的记录。"><button class="admin-secondary" @click="refresh()">重新加载动态档案</button></UiEmptyState>
  <div v-else-if="posts?.length" class="admin-moment-list">
    <article v-for="post in posts" :key="post.id" class="admin-moment-item">
      <img v-if="post.images[0]" :src="post.images[0].image.src" alt="" loading="lazy">
      <div>
        <div class="admin-row-actions"><span class="admin-photo-status" :data-status="post.status === 'draft' ? 'draft' : post.visibility === 'private' ? 'private' : 'published'">{{ post.status === 'draft' ? '草稿' : post.visibility === 'private' ? '私密' : '公开' }}</span><span class="admin-meta">{{ post.topicLabel || topicLabel(post.topic) }} · {{ post.viewCount }} 次浏览</span></div>
        <h2>{{ post.title || post.body.slice(0, 32) || '图片动态' }}</h2><p class="admin-meta">{{ post.body.slice(0, 110) }}</p>
        <div class="admin-row-actions"><NuxtLink :to="`/admin/posts/${post.id}`" class="admin-action-link"><UiIcon name="edit"/>编辑动态</NuxtLink><button v-if="pendingDelete !== post.id" class="admin-quiet" @click="pendingDelete = post.id"><UiIcon name="trash"/>移除</button><template v-else><span>确认移除此动态？</span><button class="admin-secondary" :disabled="busy" @click="remove(post.id)">确认移除</button><button class="admin-quiet" @click="pendingDelete = ''">取消</button></template></div>
      </div>
    </article>
  </div>
  <UiEmptyState v-else art="note" title="第一条记录，从此刻开始。" description="日常、骑行、器材或一句随想，都可以写在这里。"><NuxtLink to="/admin/posts/new" class="admin-secondary"><UiIcon name="edit"/>开始写一条</NuxtLink></UiEmptyState>
</section>
</template>