<script setup lang="ts">
import {computed} from 'vue'
import {categoryPresentation} from '~/utils/category-presentation'
import Icon from './Icon.vue'
const props=defineProps<{name:string}>()
const label=computed(()=>categoryPresentation(props.name))
</script>
<template><span class="category-label"><span>{{ label.text }}</span><Icon v-for="icon in label.icons" :key="icon" :name="icon"/></span></template>
