<script setup lang="ts">
import { computed } from 'vue'

import type { PublicExif } from '~/types/content'

const props = defineProps<{ exif: PublicExif }>()

const rows = computed(() => [
  { label: '相机', value: props.exif.camera },
  { label: '镜头', value: props.exif.lens },
  { label: '焦距', value: props.exif.focalLengthMm === undefined ? undefined : `${props.exif.focalLengthMm} mm` },
  { label: '光圈', value: props.exif.aperture === undefined ? undefined : `f/${props.exif.aperture}` },
  { label: '快门', value: props.exif.shutter },
  { label: 'ISO', value: props.exif.iso === undefined ? undefined : String(props.exif.iso) },
  { label: '拍摄时间', value: props.exif.capturedAt?.replace('T', ' ').slice(0, 16) }
].filter((row): row is { label: string; value: string } => Boolean(row.value)))
</script>

<template>
  <dl class="exif-panel" aria-label="照片参数">
    <div v-for="row in rows" :key="row.label">
      <dt>{{ row.label }}</dt>
      <dd>{{ row.value }}</dd>
    </div>
  </dl>
</template>
