<script setup lang="ts">
const {notice,close}=useAdminNotice()
let timer:ReturnType<typeof setTimeout>|undefined, paused=false
function schedule(){
  clearTimeout(timer)
  if(notice.value&&!paused){const id=notice.value.id;timer=setTimeout(()=>close(id),2000)}
}
function pause(){paused=true;clearTimeout(timer)}
function resume(){paused=false;schedule()}
watch(notice,schedule,{immediate:true})
onBeforeUnmount(()=>{clearTimeout(timer);close()})
</script>
<template><Teleport to="body"><div class="admin-notices" role="status" aria-live="polite" aria-atomic="true"><Transition name="notice" mode="out-in"><div v-if="notice" :key="notice.id" class="admin-toast" :data-tone="notice.tone" @mouseenter="pause" @mouseleave="resume" @focusin="pause" @focusout="resume"><UiIcon :name="notice.tone==='success'?'check':'info'"/><span>{{ notice.message }}</span><button type="button" aria-label="关闭提示" @click="close()"><UiIcon name="close"/></button></div></Transition></div></Teleport></template>
