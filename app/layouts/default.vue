<script setup lang="ts">const route=useRoute()</script>
<template>
  <div class="site-shell" :class="{'site-shell--notebook':route.path==='/about'}">
    <SiteAmbientBackground />
    <SiteHeader />
    <main id="main-content">
      <slot />
    </main>
    <SiteFooter />
    <SiteRouteCurtain />
  </div>
</template>
