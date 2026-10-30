export default defineNuxtConfig({
  buildDir: process.env.JOURNAL_BUILD_DIR || '.nuxt',
  devServer: { host: '127.0.0.1' },
  compatibilityDate: '2026-10-25',
  css: ['~/assets/css/main.css', '~/assets/css/admin.css', '~/assets/css/notebook.css', '~/assets/css/workspace-ui.css'],
  devtools: { enabled: false },
  runtimeConfig: { public: { icpNumber: '' } },
  routeRules: { '/stories/**': { redirect: '/gallery' }, '/admin/stories/**': { redirect: '/admin' } },
  vite: {
    cacheDir: process.env.JOURNAL_BUILD_DIR ? `${process.env.JOURNAL_BUILD_DIR}/vite-cache` : 'node_modules/.cache/vite',
    optimizeDeps: { include: ['lenis', 'gsap', 'gsap/ScrollTrigger'] }
  },
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
