<script setup lang="ts">
const { phase, target, snapshot } = useRouteCurtain()
const headerBottom = ref(72)
onMounted(() => {
  const header = document.querySelector('.site-header')
  const measure = () => { headerBottom.value = Math.max(0, header?.getBoundingClientRect().bottom ?? 72) }
  const observer = new ResizeObserver(measure)
  if (header) observer.observe(header)
  measure()
  onBeforeUnmount(() => observer.disconnect())
})
</script>

<template>
  <div
    class="route-curtain"
    :data-state="phase"
    data-route-curtain
    :data-target="target"
    :style="target === 'gallery' ? { top: `${headerBottom}px` } : undefined"
    aria-hidden="true"
    @wheel.prevent
    @touchmove.prevent
  >
    <SiteApertureTransition v-show="phase !== 'idle' && target === 'gallery'" :phase="target === 'gallery' ? phase : 'idle'" />
    <SiteCyclistTransition v-if="phase !== 'idle' && target === 'about'" :snapshot="snapshot" :running="phase === 'revealing'" />
  </div>
</template>
