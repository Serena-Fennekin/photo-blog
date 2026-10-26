<script setup lang="ts">
import { computed } from 'vue'

import type { StorySummary } from '~/types/content'

const props = defineProps<{ story: StorySummary }>()
const displayDate = computed(() => props.story.capturedOn.replaceAll('-', '.'))
</script>

<template>
  <article class="time-chapter">
    <header class="time-chapter__header">
      <div>
        <p class="time-chapter__date" data-home-motion="chapter-date">{{ displayDate }}</p>
        <p v-if="story.location" class="time-chapter__location">{{ story.location }}</p>
      </div>
      <div class="time-chapter__copy" data-home-motion="chapter-copy">
        <p class="eyebrow">A PHOTOGRAPHIC NOTE</p>
        <h2>{{ story.title }}</h2>
        <p v-if="story.note" class="time-chapter__note">{{ story.note }}</p>
        <NuxtLink class="text-link" :to="`/stories/${story.slug}`">翻阅这组记录 ↗</NuxtLink>
      </div>
    </header>

    <div class="time-chapter__photos">
      <figure
        v-for="(photo, index) in story.previewPhotos"
        :key="photo.id"
        :class="{ 'is-secondary': index > 0 }"
        :data-home-motion="index === 0 ? 'chapter-primary-photo' : 'chapter-secondary-photo'"
      >
        <img
          :src="photo.image.src"
          :srcset="photo.image.srcset"
          sizes="(max-width: 760px) 92vw, 48vw"
          :width="photo.image.width"
          :height="photo.image.height"
          :alt="photo.image.alt"
          loading="lazy"
        >
        <figcaption v-if="photo.caption">{{ photo.caption }}</figcaption>
      </figure>
    </div>
  </article>
</template>
