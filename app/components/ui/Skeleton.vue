<script setup lang="ts">
withDefaults(defineProps<{variant?:'gallery'|'feed'|'form'|'list';label?:string;count?:number}>(),{variant:'list',label:'正在加载内容',count:3})
</script>
<template>
  <div class="ui-skeleton" :class="`ui-skeleton--${variant}`" :data-skeleton="variant" role="status" aria-busy="true">
    <span class="visually-hidden">{{ label }}</span>
    <div class="skeleton-layout" aria-hidden="true"><div v-for="item in count" :key="item" class="skeleton-card">
      <template v-if="variant==='gallery'"><span class="skeleton-block skeleton-photo"></span></template>
      <template v-else><div class="skeleton-identity"><span class="skeleton-block skeleton-avatar"></span><div><span class="skeleton-block skeleton-line"></span><span class="skeleton-block skeleton-line skeleton-line--short"></span></div></div><span class="skeleton-block skeleton-line"></span><span class="skeleton-block skeleton-line"></span><span class="skeleton-block skeleton-line skeleton-line--short"></span><span v-if="variant==='form'" class="skeleton-block skeleton-field"></span></template>
    </div></div>
  </div>
</template>
