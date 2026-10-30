<script setup lang="ts">
import type { Category } from '~/types/content'
import CategoryLabel from '../ui/CategoryLabel.vue'

defineProps<{
  categories: Category[]
  activeCategory?: string
}>()
</script>

<template>
  <nav class="category-filter" aria-label="摄影集分类">
    <NuxtLink
      data-category="all"
      :to="{ path: '/gallery' }"
      :aria-current="!activeCategory ? 'page' : undefined"
    >
      全部
    </NuxtLink>
    <NuxtLink
      v-for="category in categories"
      :key="category.slug"
      :data-category="category.slug"
      :to="{ path: '/gallery', query: { category: category.slug } }"
      :aria-current="activeCategory === category.slug ? 'page' : undefined"
    >
      <CategoryLabel :name="category.name" />
    </NuxtLink>
  </nav>
</template>
