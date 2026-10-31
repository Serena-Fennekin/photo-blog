<script setup lang="ts">
withDefaults(defineProps<{title:string;description:string;art?:'photos'|'note'|'category'|'error'}>(),{art:'note'})
</script>
<template>
  <div class="ui-empty" :data-empty="art" role="status">
    <svg class="empty-illustration" viewBox="0 0 160 118" fill="none" aria-hidden="true">
      <ellipse class="empty-wash" cx="80" cy="61" rx="65" ry="48"/>
      <g stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <template v-if="art==='photos'"><rect x="37" y="24" width="73" height="64" rx="9" transform="rotate(-9 37 24)" class="empty-paper"/><rect x="51" y="34" width="73" height="64" rx="9" class="empty-paper"/><path d="m60 81 18-21 15 13 10-9 12 17M60 89h55"/><circle cx="104" cy="49" r="6"/></template>
        <template v-else-if="art==='category'"><path class="empty-paper" d="M29 41a8 8 0 0 1 8-8h32l9 10h43a8 8 0 0 1 8 8l-6 39H36Z"/><path d="M39 54h78M76 64v18M67 73h18"/></template>
        <template v-else-if="art==='error'"><path class="empty-paper" d="M40 29h56l22 22v46H40Z"/><path d="M96 29v22h22M79 62v13M79 83h.01"/><path d="M29 45a43 43 0 0 0-5 22M125 28l5 6-7 1"/></template>
        <template v-else><rect x="44" y="23" width="70" height="77" rx="10" class="empty-paper"/><path d="M59 43h40M59 54h33M59 65h37M59 76h20M38 38h12M38 52h12M38 66h12M38 80h12"/></template>
        <path class="empty-sprig" d="M125 96c-3-16 2-25 11-34m-10 18c-11 0-13-7-13-11 10 1 14 5 13 11Zm3-5c0-11 8-16 13-15-1 10-5 15-13 15Z"/>
        <path class="empty-spark" d="M24 28v10m-5-5h10M132 41v6m-3-3h6"/>
      </g>
    </svg>
    <h3>{{ title }}</h3><p>{{ description }}</p><div v-if="$slots.default" class="ui-empty__action"><slot/></div>
  </div>
</template>
