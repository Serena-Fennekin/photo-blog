<script setup lang="ts">
import { topicLabel, formatPostDate } from '#shared/notebook'
import type { PublicPost } from '../../../shared/types/notebook'
const props = defineProps<{ post: PublicPost; author: string; avatar?:string; readable: boolean }>()
const emit = defineEmits<{ images: [post: PublicPost, index: number] }>()
const root = ref<HTMLElement | null>(null), total = ref(props.post.viewCount)
let observer: IntersectionObserver | undefined, timer: ReturnType<typeof setTimeout> | undefined
let counted = false, disposed = false, intersecting = false, pending = false
const date = computed(() => formatPostDate(props.post.publishedAt))
function schedule() {
  clearTimeout(timer)
  if (!intersecting || !props.readable || counted || pending || disposed) return
  timer = setTimeout(async () => {
      if (document.hidden || disposed || !props.readable || !intersecting) return
      pending = true
      try {
        const result = await $fetch<{ total: number }>(`/api/public/posts/${props.post.id}/view`, { method: 'POST' })
        if (!disposed) { total.value = result.total; counted = true; observer?.disconnect() }
      } catch { /* Reading remains available; a later visit can retry counting. */ }
      finally { pending = false }
    }, 1000)
}
watch(() => props.readable, schedule)
onMounted(() => {
  observer = new IntersectionObserver(entries => { intersecting = Boolean(entries[0]?.isIntersecting); schedule() }, { threshold: 0 })
  if (root.value) observer.observe(root.value)
})
onBeforeUnmount(() => { disposed = true; clearTimeout(timer); observer?.disconnect() })
</script>
<template>
  <article ref="root" class="moment-card" :data-post-id="post.id">
    <NotebookCardOrnament />
    <header class="moment-heading"><UiAuthorAvatar class="moment-avatar" :name="author" :src="avatar"/><div><strong>{{ author }}</strong><time :datetime="post.publishedAt">{{ date }}</time></div><span class="moment-topic">{{ post.topicLabel || topicLabel(post.topic) }}</span></header>
    <h3 v-if="post.title">{{ post.title }}</h3>
    <p v-if="post.body" class="moment-body">{{ post.body }}</p>
    <div v-if="post.images.length" class="moment-images" :class="{ 'moment-images--single': post.images.length === 1 }">
      <button v-for="(asset, index) in post.images" :key="asset.id" type="button" :aria-label="`查看第${index + 1}张图片`" @click="emit('images', post, index)"><img :src="asset.image.src" :srcset="asset.image.srcset" :width="asset.image.width" :height="asset.image.height" :alt="post.title ? `${post.title} · 配图${index + 1}` : `动态配图${index + 1}`" loading="lazy" sizes="(max-width: 720px) 85vw, 680px"></button>
    </div>
    <footer class="moment-meta"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg><span data-post-views>{{ total }} 次浏览</span></footer>
  </article>
</template>
