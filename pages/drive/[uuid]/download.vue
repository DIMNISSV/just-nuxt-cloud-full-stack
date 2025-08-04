<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-100">
    <div class="p-8 bg-white rounded-lg shadow-md text-center">
      <div v-if="pending" class="space-y-2">
        <Icon name="heroicons:arrow-path-20-solid" class="w-8 h-8 text-blue-500 animate-spin mx-auto" />
        <p class="text-gray-600">Подготовка ссылки на скачивание...</p>
      </div>
      <div v-else-if="error" class="space-y-2">
        <Icon name="heroicons:exclamation-triangle-20-solid" class="w-8 h-8 text-red-500 mx-auto" />
        <p class="text-red-700 font-semibold">Ошибка!</p>
        <p class="text-sm text-gray-500">{{ error.data?.message || 'Не удалось получить ссылку.' }}</p>
        <UButton to="/drive" label="Вернуться на Диск" class="mt-4" />
      </div>
      <div v-else class="space-y-2">
        <Icon name="heroicons:check-circle-20-solid" class="w-8 h-8 text-green-500 mx-auto" />
        <p class="text-gray-600">Скачивание файла <span class="font-bold">{{ filename }}</span> началось.</p>
        <p class="text-sm text-gray-500">Это окно можно закрыть.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue';

const route = useRoute();
const uuid = route.params.uuid as string;

// Запрашиваем ссылку у нашего API
const { data, pending, error } = await useFetch(`/api/v1/storage/nodes/${uuid}/download`);

const filename = computed(() => data.value?.filename || 'файл');

// Как только данные (ссылка) получены, запускаем скачивание
watch(data, (newData) => {
  if (newData?.downloadUrl) {
    triggerDownload(newData.downloadUrl, newData.filename);
  }
}, { immediate: true });

function triggerDownload(url: string, filename: string) {
  if (process.server) return; // Эта логика работает только в браузере

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
</script>