<script setup lang="ts">
const props=defineProps<{name:string;src?:string}>(), failed=ref(false)
watch(()=>props.src,()=>{failed.value=false})
const initial=computed(()=>Array.from(props.name.trim())[0]||'摄')
</script>
<template><span class="author-avatar" aria-hidden="true"><img v-if="src&&!failed" :src="src" alt="" @error="failed=true"><span v-else>{{ initial }}</span></span></template>
