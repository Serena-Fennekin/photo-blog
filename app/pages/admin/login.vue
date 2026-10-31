<script setup lang="ts">
definePageMeta({ layout: false })
useSeoMeta({ title: '管理登录 — PHOTO JOURNAL', robots: 'noindex, nofollow' })
const { data: state } = await useFetch('/api/admin/auth/state')
const username = ref(''), password = ref(''), busy = ref(false), error = ref('')
const hydrated = ref(false)
onMounted(() => { hydrated.value = true })
const setup = computed(() => state.value?.canSetup === true)
async function submit() {
  busy.value = true; error.value = ''
  try { await $fetch(`/api/admin/auth/${setup.value ? 'setup' : 'login'}`, { method: 'POST', body: { username: username.value, password: password.value } }); password.value = ''; await navigateTo('/admin') }
  catch (cause: any) { error.value = cause.data?.statusMessage || '登录失败，请检查用户名和密码' }
  finally { busy.value = false }
}
</script>
<template>
  <main class="admin-login"><NuxtLink class="site-brand" to="/">PHOTO<span>JOURNAL</span></NuxtLink><section><p class="admin-kicker">摄影者的工作台</p><h1>{{ setup ? '从这里，开始记录。' : '欢迎回来。' }}</h1><p class="admin-description">{{ setup ? '首次使用，请创建唯一的管理员账号。密码由你在本机设置。' : '整理照片，留下几句随笔，然后将它们交给世界。' }}</p><form class="admin-form" method="post" @submit.prevent="submit"><label>用户名<input v-model="username" name="username" autocomplete="username" required maxlength="60"></label><label>密码<input v-model="password" name="password" type="password" :autocomplete="setup ? 'new-password' : 'current-password'" :minlength="setup ? 12 : 1" maxlength="128" required></label><small v-if="setup">密码至少12个字符。创建后将自动关闭初始化入口。</small><p v-if="error" class="admin-error" role="alert">{{ error }}</p><button class="admin-primary" type="submit" :disabled="busy || !hydrated">{{ busy ? '请稍等…' : setup ? '创建账号并进入' : '登录' }}</button></form></section></main>
</template>
