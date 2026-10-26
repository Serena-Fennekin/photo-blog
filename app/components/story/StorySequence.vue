<script setup lang="ts">
import type { StoryDetail } from '~/types/content'

withDefaults(defineProps<{ story: StoryDetail; interactive?: boolean }>(), {
  interactive: true
})
const emit = defineEmits<{ select: [photoId: string] }>()
</script>

<template>
  <section class="story-sequence" :aria-label="`${story.title}的照片`">
    <figure
      v-for="(photo, index) in story.photos"
      :key="photo.id"
      class="story-sequence__item"
      :class="`is-position-${index % 3}`"
      :data-story-photo-id="photo.id"
    >
      <button
        type="button"
        :disabled="!interactive"
        :aria-label="`查看照片详情：${photo.image.alt}`"
        @click="emit('select', photo.id)"
      >
        <img
          :src="photo.image.src"
          :srcset="photo.image.srcset"
          sizes="(max-width: 760px) 94vw, 72vw"
          :width="photo.image.width"
          :height="photo.image.height"
          :alt="photo.image.alt"
          loading="lazy"
        >
      </button>
      <figcaption>
        <span>{{ String(index + 1).padStart(2, '0') }}</span>
        <span v-if="photo.caption">{{ photo.caption }}</span>
      </figcaption>
    </figure>
  </section>
</template>
