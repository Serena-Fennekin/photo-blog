<script setup lang="ts">
const { phase, target, snapshot } = useRouteCurtain()
</script>

<template>
  <div
    class="route-curtain"
    :data-state="phase"
    data-route-curtain
    :data-target="target"
    aria-hidden="true"
    @wheel.prevent
    @touchmove.prevent
  >
    <SiteCameraTransition v-if="phase !== 'idle' && target === 'gallery'" :phase="phase" />
    <SiteCyclistTransition v-if="phase !== 'idle' && target === 'about'" :snapshot="snapshot" :running="phase === 'revealing'" />
  </div>
</template>
