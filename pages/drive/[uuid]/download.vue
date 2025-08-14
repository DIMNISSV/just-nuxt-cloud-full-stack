<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-100">
    <div class="p-8 bg-white rounded-lg shadow-md text-center w-full max-w-md">
      <div v-if="pending" class="space-y-4">
        <Icon name="heroicons:arrow-path-20-solid" class="w-12 h-12 text-gray-400 animate-spin mx-auto" />
        <p class="text-gray-600">Подготовка файла к скачиванию...</p>
      </div>
      <div v-else-if="error" class="space-y-4">
        <Icon name="heroicons:exclamation-triangle-20-solid" class="w-12 h-12 text-red-400 mx-auto" />
        <h2 class="text-xl font-bold text-red-800">Ошибка</h2>
        <p class="text-sm text-gray-500">{{ error.data?.message || 'Не удалось получить доступ к файлу.' }}</p>
        <UButton to="/drive" label="Вернуться на Диск" class="mt-4" />
      </div>
      <div v-else-if="data" class="space-y-4">
        <Icon name="heroicons:document-arrow-down-20-solid" class="w-12 h-12 text-blue-500 mx-auto" />
        <h2 class="text-xl font-semibold text-gray-800 break-all">{{ data.filename }}</h2>
        <UButton @click="handleDownload" size="lg" variant="outline" block label="Скачать файл" :disabled="isDownloading"
          :loading="isDownloading" />
        <p v-if="isDownloading" class="text-sm text-gray-500">Ваше скачивание скоро начнется...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const uuid = route.params.uuid as string;
const isDownloading = ref(false);

// Запрашиваем ссылку у нашего API
const { data, pending, error } = await useFetch(`/api/v1/storage/nodes/${uuid}/download`);

const handleDownload = () => {
  if (data.value?.downloadUrl) {
    isDownloading.value = true;
    triggerDownload(data.value.downloadUrl, data.value.filename);
    // Можно добавить задержку, чтобы пользователь видел состояние загрузки
    setTimeout(() => { isDownloading.value = false; }, 3000);
  }
};

function triggerDownload(url: string, filename: string) {
  if (process.server) return;
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
</script>