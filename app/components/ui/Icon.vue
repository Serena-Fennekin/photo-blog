<script setup lang="ts">
defineProps<{name:string}>()
const paths:Record<string,string[]>={
  check:['m5 12 4 4L19 6'],close:['m6 6 12 12M6 18 18 6'],plus:['M12 5v14M5 12h14'],
  upload:['M12 16V3m-5 5 5-5 5 5','M4 15v5h16v-5'],image:['M3 3h18v18H3z','m3 17 6-6 5 5 3-3 4 4','M15 7h.01'],
  edit:['m15 5 4 4M4 20l4-1L21 6l-4-4L4 15Z'],eye:['M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z','M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6'],
  trash:['M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7'],info:['M12 8h.01M12 11v6','M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20'],
  cat:['M5 8 4 3l6 3h4l6-3-1 5a8 8 0 1 1-14 0Z','M8 12h.01M16 12h.01m-6 4 2 1 2-1M2 14l5 1m10 0 5-1'],
  dog:['M7 5 3 7v8l4-2m10-8 4 2v8l-4-2M7 6c3-3 7-3 10 0v11c-2 5-8 5-10 0Z','M10 15h4l-2 2Zm-2-6h.01M15 9h.01'],
  bike:['M8 17a4 4 0 1 0-8 0 4 4 0 0 0 8 0Zm16 0a4 4 0 1 0-8 0 4 4 0 0 0 8 0Z','m4 17 5-9 5 9H4m5-9h8m-2-4h3l3 13M7 5h4'],
  leaf:['M20 3C11 2 3 5 4 14c1 8 12 9 15 0 1-4 0-7 1-11ZM3 22l12-13M7 16h6'],
  flower:['M12 8c-6-12-12 0-4 3-12 3-2 14 4 5 6 9 16-2 4-5 8-3 2-15-4-3Z','M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6'],
  fish:['M3 12c6-10 14-8 18 0-4 8-12 10-18 0Zm0 0L0 7v10l3-5M16 10h.01M10 5l-1 5M10 19l-1-5'],
  shrimp:['M18 6c-8-7-17 1-12 8l6 5 5-2-3-3-4-1c-3-2-2-5 1-5h6l3-4m-3 4 4 2m-4-4 3-4','M5 8 9 11M5 12l4 2m0 3 3-3m0 5 2-3M10 7 8 2m5 5V1M15 8h.01'],
  landscape:['M2 20 9 6l6 10 3-5 5 9H2m4-7 3 1 2-2M17 3h.01'],
  camera:['M3 6h5l2-3h5l2 3h4v14H3Z','M12 8a5 5 0 1 0 0 10 5 5 0 0 0 0-10'],
  sparkles:['m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5L12 2ZM20 2v4m-2-2h4'],
  sun:['M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2'],
  moon:['M20 15A9 9 0 0 1 9 3a9 9 0 1 0 11 12Z'],monitor:['M3 3h18v14H3ZM8 21h8M12 17v4']
}
</script>
<template><svg class="ui-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path v-for="(path,index) in paths[name]||paths.info" :key="index" :d="path"/></svg></template>
