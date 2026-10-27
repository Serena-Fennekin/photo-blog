export default defineNuxtRouteMiddleware(async () => {
  try { await useRequestFetch()('/api/admin/auth/me') }
  catch { return navigateTo('/admin/login') }
})
