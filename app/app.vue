<script setup lang="ts">
onMounted(() => { document.documentElement.dataset.appReady = 'true' })
</script>
<template>
  <UiGlassDefinitions />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
