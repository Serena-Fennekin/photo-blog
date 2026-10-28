<script setup lang="ts">definePageMeta({ layout: 'admin', middleware: 'admin' }); const id = String(useRoute().params.id)</script>
<template><NotebookPostEditor :post-id="id" /></template>
