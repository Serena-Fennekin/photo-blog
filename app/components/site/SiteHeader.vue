<template>
  <header class="site-header">
    <NuxtLink class="site-brand" to="/" aria-label="摄影日志首页">
      PHOTO<span>JOURNAL</span>
    </NuxtLink>

    <nav class="site-nav" aria-label="主导航">
      <NuxtLink to="/">首页</NuxtLink>
      <NuxtLink to="/gallery">摄影集</NuxtLink>
      <NuxtLink to="/about">关于我</NuxtLink>
    </nav>

    <div class="site-controls"><SiteBackgroundToggle /><SiteThemeSelector /></div>
  </header>
</template>
