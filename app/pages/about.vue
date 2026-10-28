<script setup lang="ts">
useSeoMeta({
  title: '关于我 — PHOTO JOURNAL',
  description: '关于这册个人摄影日志，以及我观看日常的方式。'
})
</script>

<template>
  <article class="about-page">
    <header class="about-page__header">
      <p class="about-page__index">ABOUT / 关于</p>
      <h1>关于我</h1>
      <p class="about-page__statement">喜欢散步，<br>也喜欢随手拍照。</p>
    </header>

    <div class="about-page__body">
      <p>路边的花草、偶遇的猫狗、平常的风景，看到喜欢的就拍下来。</p>
      <p>这里是我的个人相册，偶尔也会留下几句随笔。</p>
      <p>谢谢你过来看看。</p>
    </div>

    <footer class="about-page__footer">
      <span>慢慢积攒的日常</span>
      <NuxtLink class="text-link" to="/gallery">看摄影集</NuxtLink>
    </footer>
  </article>
</template>
