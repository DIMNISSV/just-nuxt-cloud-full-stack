<template>
  <div class="max-w-2xl mx-auto">
    <h1 class="text-3xl font-bold mb-6">Новая загрузка</h1>
    <div class="bg-white p-8 rounded-lg shadow-md border">
      <div class="mb-6 pb-6 border-b">
        <label for="file-upload" class="block text-sm font-medium text-gray-700">Пакетная загрузка файлов</label>
        <div class="mt-1 p-6 border-2 border-dashed rounded-md text-center">
          <p class="text-gray-500">Перетащите файлы сюда или кликните для выбора</p>
          <p class="text-xs text-gray-400 mt-1">(Это имитация, файлы не будут загружены)</p>
          <input id="file-upload" type="file" multiple class="sr-only">
        </div>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-6">
        <div>
          <label for="type" class="block text-sm font-medium text-gray-700">Тип загрузки</label>
          <select id="type" v-model="type" class="mt-1 block w-full rounded-md border-gray-300">
            <option value="url">Универсальная (yt-dlp)</option>
            <option value="torrent">Торрент (magnet)</option>
          </select>
        </div>
        <div>
          <label for="sources" class="block text-sm font-medium text-gray-700">
            Источники (каждый с новой строки)
          </label>
          <textarea id="sources" v-model="sources" rows="5" required
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm font-mono"
            :placeholder="placeholderText"></textarea>
          <p class="mt-1 text-xs text-gray-500">
            Тип "Универсальная" поддерживает прямые ссылки, Google Drive, YouTube и др.
          </p>
        </div>

        <div v-if="error" class="p-3 bg-red-100 text-red-700 rounded-md text-sm">
          {{ error }}
        </div>

        <button type="submit" :disabled="isLoading"
          class="w-full py-2 px-4 bg-blue-600 text-white rounded-md disabled:opacity-50">
          {{ isLoading ? 'Отправка...' : 'Добавить в очередь' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { UploadType } from '~/types';

definePageMeta({ middleware: 'auth' });

const type = ref<UploadType>('url');
const sources = ref('');
const isLoading = ref(false);
const error = ref<string | null>(null);

const placeholderText = computed(() => {
  switch (type.value) {
    case 'torrent': return 'magnet:?xt=urn:btih:...';
    case 'url':
    default:
      return 'https://example.com/file.mkv\nhttps://youtube.com/watch?v=...';
  }
});


async function handleSubmit() {
  isLoading.value = true;
  error.value = null;

  const sourcesArray = sources.value.split('\n').map(s => s.trim()).filter(Boolean);
  if (sourcesArray.length === 0) {
    error.value = 'Укажите хотя бы один источник.';
    isLoading.value = false;
    return;
  }

  try {
    // В API тип 'gdrive' и 'yt-dlp' будут обработаны как 'url',
    // но на реальном бэкенде это будет иметь значение.
    const apiType = ['gdrive', 'yt-dlp'].includes(type.value) ? 'url' : type.value;

    await $fetch('/api/v1/account/uploads', {
      method: 'POST',
      body: {
        type: type.value,
        sources: sourcesArray,
      }
    });
    await navigateTo('/account/uploads');
  } catch (e: any) {
    error.value = e.data?.message || 'Произошла ошибка';
  } finally {
    isLoading.value = false;
  }
}
</script>