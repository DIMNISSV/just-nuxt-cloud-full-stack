<template>
  <div>
    <h1 class="text-2xl font-bold mb-4">Профиль пользователя</h1>
    <div v-if="user" class="p-4 bg-white rounded-lg border">
      <p><strong>ID:</strong> {{ user.id }}</p>
      <p><strong>Имя пользователя:</strong> {{ user.username }}</p>
      <p><strong>Роль:</strong> {{ user.role }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const { user } = useAuth();
</script>