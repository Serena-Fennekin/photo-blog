<script setup lang="ts">
useSeoMeta({ robots: 'noindex, nofollow', title: '管理工作台 — PHOTO JOURNAL' })
const ready = ref(false)
onMounted(() => { ready.value = true })
const logout = async () => { await $fetch('/api/admin/auth/logout', { method: 'POST' }); await navigateTo('/admin/login') }
</script>
<template>
  <div class="admin-shell" :inert="!ready">
    <header class="admin-header"><NuxtLink class="site-brand" to="/admin">PHOTO<span>WORKSPACE</span></NuxtLink><nav aria-label="管理导航"><NuxtLink to="/admin">照片</NuxtLink><NuxtLink to="/admin/posts">动态</NuxtLink><NuxtLink to="/admin/categories">分类</NuxtLink><NuxtLink to="/admin/settings">文案设置</NuxtLink><NuxtLink to="/" target="_blank">查看网站 ↗</NuxtLink></nav><SiteThemeSelector /><button class="admin-quiet" type="button" @click="logout">退出</button></header>
    <main class="admin-main"><slot /></main>
  </div>
</template>
