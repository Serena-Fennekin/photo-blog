<script setup lang="ts">
import type { PostImage } from '../../../shared/types/notebook'
const props = defineProps<{ images: PostImage[]; initialIndex: number }>()
const emit = defineEmits<{ close: [] }>()
const dialog = ref<HTMLDialogElement | null>(null), index = ref(props.initialIndex)
const image = computed(() => props.images[index.value]!.image)
onMounted(() => dialog.value?.showModal())
onBeforeUnmount(() => dialog.value?.close())
function key(event: KeyboardEvent) {
  if (event.key === 'ArrowLeft') { event.preventDefault(); index.value = Math.max(0, index.value - 1) }
  if (event.key === 'ArrowRight') { event.preventDefault(); index.value = Math.min(props.images.length - 1, index.value + 1) }
}
</script>
<template><dialog ref="dialog" class="moment-viewer" aria-label="动态图片" @cancel.prevent="emit('close')" @keydown="key" @click="event => { if(event.target === dialog) emit('close') }"><button class="moment-viewer__close" aria-label="关闭动态图片" @click="emit('close')">关闭 ×</button><img :src="image.src" :srcset="image.srcset" :alt="`动态配图${index + 1}`"><div class="moment-viewer__controls"><button :disabled="index === 0" @click="index--">上一张</button><span>{{ index + 1 }} / {{ images.length }}</span><button :disabled="index === images.length - 1" @click="index++">下一张</button></div></dialog></template>
