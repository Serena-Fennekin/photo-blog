export default defineNuxtConfig({
  buildDir: process.env.JOURNAL_BUILD_DIR || '.nuxt',
  compatibilityDate: '2026-10-25',
  css: ['~/assets/css/main.css', '~/assets/css/admin.css'],
  devtools: { enabled: false },
  routeRules: { '/stories/**': { redirect: '/gallery' }, '/admin/stories/**': { redirect: '/admin' } },
  vite: { optimizeDeps: { include: ['lenis', 'gsap', 'gsap/ScrollTrigger'] } },
  app: {
    head: {
      htmlAttrs: { lang: 'zh-CN' },
      script: [{
        key: 'theme-bootstrap',
        innerHTML: `(function(){try{var p=localStorage.getItem('photo-journal-theme');var v=p==='dark'||p==='light'||p==='system'?p:'system';var d=v==='system'?matchMedia('(prefers-color-scheme: dark)').matches?v='dark':'light':v;document.documentElement.dataset.theme=d}catch(e){document.documentElement.dataset.theme='dark'}})()`
      }]
    }
  },
  typescript: { typeCheck: true }
})
