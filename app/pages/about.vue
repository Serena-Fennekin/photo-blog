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
      <p class="about-page__statement">我拍下的不是远方，<br>而是日常短暂显露出的形状。</p>
    </header>

    <div class="about-page__body">
      <p>生活在杭州。常常沿着江边、旧街和山路行走，等待光线让熟悉的地方变得陌生一点。</p>
      <p>这里是一册持续生长的个人摄影日志。照片按时间与感受被整理，文字只保留当时最短的一句。</p>
      <p>如果一张照片让你停了一会儿，它就已经完成了自己的事情。</p>
    </div>

    <footer class="about-page__footer">
      <span>HANGZHOU, CHINA</span>
      <NuxtLink class="text-link" to="/gallery">看摄影集</NuxtLink>
    </footer>
  </article>
</template>
