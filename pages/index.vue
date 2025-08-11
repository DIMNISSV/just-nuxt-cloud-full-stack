<template>
  <div>Перенаправление на ваш диск...</div>
</template>

<script setup>
await navigateTo('/drive', { redirectCode: 301 });
</script>