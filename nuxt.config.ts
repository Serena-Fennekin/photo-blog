export default defineNuxtConfig({
  compatibilityDate: '2026-10-25',
  css: ['~/assets/css/main.css'],
  devtools: { enabled: false },
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
