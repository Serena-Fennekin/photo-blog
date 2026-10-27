<script setup lang="ts">
onMounted(() => { document.documentElement.dataset.appReady = 'true' })
</script>
<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
