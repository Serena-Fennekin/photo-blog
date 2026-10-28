<template>
  <div class="site-shell">
    <SiteAmbientBackground />
    <SiteHeader />
    <main id="main-content">
      <slot />
    </main>
    <SiteFooter />
    <SiteRouteCurtain />
  </div>
</template>
