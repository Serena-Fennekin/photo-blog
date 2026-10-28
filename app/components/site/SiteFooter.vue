<script setup lang="ts">
const { public: { icpNumber } } = useRuntimeConfig()
</script>

<template>
  <footer class="site-footer">
    <p>慢慢拍，慢慢记。</p>
    <p class="site-footer__registration">
      <a v-if="icpNumber" href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">{{ icpNumber }}</a>
      <span v-else>备案信息待更新</span>
    </p>
    <p class="site-footer__meta">个人摄影相册</p>
  </footer>
</template>
