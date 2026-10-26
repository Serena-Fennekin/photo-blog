<script setup lang="ts">
import { computed } from 'vue'

import type { StoryDetail } from '~/types/content'

const props = defineProps<{ story: StoryDetail }>()
const displayDate = computed(() => props.story.capturedOn.replaceAll('-', '.'))
</script>

<template>
  <header class="story-header">
    <div class="story-header__date" aria-label="拍摄日期">{{ displayDate }}</div>
    <div class="story-header__title">
      <h1>{{ story.title }}</h1>
      <p v-if="story.note" class="story-header__note">{{ story.note }}</p>
    </div>
    <div class="story-header__meta">
      <p v-if="story.location">{{ story.location }}</p>
      <ul aria-label="分类">
        <li v-for="category in story.categories" :key="category.slug">{{ category.name }}</li>
      </ul>
    </div>
  </header>
</template>
