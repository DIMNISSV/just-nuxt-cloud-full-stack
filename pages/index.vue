<template>
  <div>Перенаправление на главную страницу...</div>
</template>

<script setup>
await navigateTo('/series', { redirectCode: 301 });
</script>