<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import { themePreferences, useThemePreference, type ThemePreference } from '~/composables/useThemePreference'

const labels: Record<ThemePreference, string> = {
  system: '跟随系统',
  dark: '深色',
  light: '浅色'
}

const { preference, resolvedTheme, setPreference } = useThemePreference()
const interactive = ref(false)
const selector = ref<HTMLElement | null>(null)
const indicator = ref<{ width: string; height: string; transform: string; transition?: string } | null>(null)
let observer: ResizeObserver | undefined
let frame = 0
let lastWidth = 0, lastHeight = 0

function measure() {
  const root = selector.value
  const choice = root?.querySelector<HTMLElement>('[aria-pressed="true"]')
  if (!root || !choice) return
  const bounds = root.getBoundingClientRect(), button = choice.getBoundingClientRect()
  if (!button.width) return
  const sameLayout = bounds.width === lastWidth && bounds.height === lastHeight
  indicator.value = { width: `${button.width}px`, height: `${button.height}px`, transform: `translate3d(${button.left - bounds.left - root.clientLeft}px, ${button.top - bounds.top - root.clientTop}px, 0)`, transition: sameLayout ? undefined : 'none' }
  lastWidth = bounds.width; lastHeight = bounds.height
}

function queueMeasure() {
  cancelAnimationFrame(frame)
  frame = requestAnimationFrame(measure)
}

watch(preference, () => nextTick(queueMeasure), { flush: 'post' })

onMounted(() => {
  interactive.value = true
  nextTick(measure)
  if (typeof ResizeObserver !== 'undefined' && selector.value) {
    observer = new ResizeObserver(queueMeasure)
    observer.observe(selector.value)
    selector.value.querySelectorAll('button').forEach(button => observer!.observe(button))
  }
  window.addEventListener('resize', queueMeasure)
  document.fonts?.ready.then(() => { if (selector.value) queueMeasure() })
})

onBeforeUnmount(() => { observer?.disconnect(); cancelAnimationFrame(frame); window.removeEventListener('resize', queueMeasure) })
</script>

<template>
  <div ref="selector" class="theme-selector" role="group" aria-label="颜色主题">
    <span v-if="indicator" class="theme-selector__indicator" :style="indicator" aria-hidden="true" />
    <button
      v-for="choice in themePreferences"
      :key="choice"
      class="theme-selector__choice"
      type="button"
      :disabled="!interactive"
      :data-theme-choice="choice"
      :aria-pressed="preference === choice"
      :aria-label="labels[choice]"
      :title="choice==='system'&&preference==='system'?`跟随浏览器提供的配色：${resolvedTheme==='dark'?'深色':'浅色'}`:labels[choice]"
      @click="setPreference(choice)"
    >
      <UiIcon :name="choice==='system'?'monitor':choice==='dark'?'moon':'sun'"/><span class="theme-selector__label">{{ labels[choice] }}</span>
    </button>
  </div>
</template>
