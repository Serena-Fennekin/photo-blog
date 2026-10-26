<script setup lang="ts">
const { phase } = useRouteCurtain()
</script>

<template>
  <div
    class="route-curtain"
    :data-state="phase"
    data-route-curtain
    aria-hidden="true"
  >
    <span class="route-curtain__line" />
    <span class="route-curtain__label">PHOTO JOURNAL</span>
  </div>
</template>
