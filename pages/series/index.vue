<template>
  <div>
    <h1 class="text-2xl font-bold mb-4">Каталог сериалов</h1>
    <div v-if="pending" class="text-gray-500">Загрузка...</div>
    <div v-else-if="error" class="text-red-500">Ошибка загрузки: {{ error.message }}</div>
    <div v-else class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <div v-for="s in series" :key="s.id" class="border rounded-lg overflow-hidden shadow-sm hover:shadow-xl transition-shadow bg-white">
        <NuxtLink :to="`/series/${s.id}`">
          <img :src="s.poster_url" :alt="s.title" class="w-full h-auto object-cover aspect-[2/3]">
          <h2 class="p-2 font-semibold text-sm truncate" :title="s.title">{{ s.title }}</h2>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
const { data: series, pending, error } = await useFetch('/api/v1/series');
</script>