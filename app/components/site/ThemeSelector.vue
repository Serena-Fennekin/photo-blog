<script setup lang="ts">
import { themePreferences, useThemePreference, type ThemePreference } from '~/composables/useThemePreference'

const labels: Record<ThemePreference, string> = {
  system: '跟随系统',
  dark: '深色',
  light: '浅色'
}

const { preference, setPreference } = useThemePreference()
</script>

<template>
  <div class="theme-selector" role="group" aria-label="颜色主题">
    <button
      v-for="choice in themePreferences"
      :key="choice"
      class="theme-selector__choice"
      type="button"
      :data-theme-choice="choice"
      :aria-pressed="preference === choice"
      @click="setPreference(choice)"
    >
      {{ labels[choice] }}
    </button>
  </div>
</template>
