<script setup lang="ts">
defineProps<{name:string}>()
const paths:Record<string,string[]>={
  check:['m5 12 4 4L19 6'],close:['m6 6 12 12M6 18 18 6'],plus:['M12 5v14M5 12h14'],
  upload:['M12 16V3m-5 5 5-5 5 5','M4 15v5h16v-5'],image:['M3 3h18v18H3z','m3 17 6-6 5 5 3-3 4 4','M15 7h.01'],
  edit:['m15 5 4 4M4 20l4-1L21 6l-4-4L4 15Z'],eye:['M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z','M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6'],
  trash:['M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7'],info:['M12 8h.01M12 11v6','M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20']
}
</script>
<template><svg class="ui-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path v-for="(path,index) in paths[name]||paths.info" :key="index" :d="path"/></svg></template>
