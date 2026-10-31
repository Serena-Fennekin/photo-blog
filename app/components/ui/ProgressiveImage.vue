<script setup lang="ts">
import {onMounted,ref,watch,nextTick} from 'vue'
import Icon from './Icon.vue'
const props=withDefaults(defineProps<{src:string;alt:string;srcset?:string;sizes?:string;width?:number;height?:number;loading?:'lazy'|'eager'}>(),{loading:'lazy'})
const image=ref<HTMLImageElement|null>(null),state=ref<'loading'|'ready'|'error'>('loading')
function checkCache(){if(image.value?.complete)state.value=image.value.naturalWidth>0?'ready':'error'}
watch(()=>props.src,async()=>{state.value='loading';await nextTick();checkCache()})
onMounted(checkCache)
</script>
<template>
  <span class="progressive-image" :data-image-state="state">
    <img ref="image" :src="src" :srcset="srcset||undefined" :sizes="sizes" :alt="alt" :width="width" :height="height" :loading="loading" decoding="async" draggable="false" @load="state='ready'" @error="state='error'">
    <span v-if="state==='loading'" class="image-placeholder" aria-hidden="true"></span>
    <span v-else-if="state==='error'" class="image-fallback" aria-hidden="true"><Icon name="image"/><span>图片暂未加载</span></span>
  </span>
</template>
