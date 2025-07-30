<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold">Мои загрузки</h1>
      <NuxtLink to="/account/uploads/new" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
        + Новая загрузка
      </NuxtLink>
    </div>

    <!-- Панель пакетных действий -->
    <div v-if="selectedUploads.length > 0"
      class="mb-4 p-3 bg-gray-100 border rounded-lg flex items-center gap-4 transition-all duration-300">
      <span class="text-sm font-semibold">Выбрано: {{ selectedUploads.length }}</span>
      <button @click="goToBatchEdit" class="px-3 py-1 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
        Пакетная настройка
      </button>
    </div>

    <div v-if="pending && !uploads" class="text-gray-500">Загрузка...</div>
    <div v-else-if="error" class="text-red-500">Ошибка: {{ error.message }}</div>
    <div v-else-if="uploads && uploads.length === 0" class="text-gray-500 bg-white p-4 rounded-lg">
      У вас еще нет загрузок.
    </div>
    <div v-else class="bg-white rounded-lg shadow-sm border overflow-hidden">
      <table class="w-full text-sm text-left">
        <thead class="bg-gray-50 border-b">
          <tr>
            <th class="p-3 w-8">
              <input type="checkbox" @change="toggleSelectAll"
                :checked="unlinkedUploadIds.length > 0 && selectedUploads.length === unlinkedUploadIds.length"
                class="rounded">
            </th>
            <th class="p-3">Источник</th>
            <th class="p-3">Тип</th>
            <th class="p-3">Статус</th>
            <th class="p-3">Дата</th>
            <th class="p-3"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="upload in uploads" :key="upload.uuid" class="border-b"
            :class="{ 'bg-blue-50 hover:bg-blue-100': selectedUploads.includes(upload.uuid), 'hover:bg-gray-50': !selectedUploads.includes(upload.uuid) }">
            <td class="p-3">
              <input type="checkbox" :value="upload.uuid" v-model="selectedUploads"
                :disabled="!!upload.linked_episode_id" class="rounded disabled:opacity-50 disabled:cursor-not-allowed">
            </td>
            <td class="p-3 font-mono truncate max-w-xs" :title="upload.source">{{ upload.source }}</td>
            <td class="p-3">{{ upload.type }}</td>
            <td class="p-3">
              <span class="px-2 py-1 text-xs rounded-full font-semibold" :class="statusClasses[upload.status]">
                {{ upload.status }}
              </span>
              <div v-if="upload.status === 'error'" class="mt-1">
                <p class="text-xs text-red-500" :title="upload.statusMessage">
                  {{ upload.statusMessage }}
                </p>
                <button @click="handleRetry(upload.uuid)" class="text-xs text-blue-600 hover:underline">
                  Повторить
                </button>
              </div>
            </td>
            <td class="p-3 text-gray-500">{{ new Date(upload.createdAt).toLocaleString() }}</td>
            <td class="p-3 text-right">
              <div class="flex items-center justify-end gap-4">
                <NuxtLink :to="`/account/uploads/${upload.uuid}`" class="text-blue-600 hover:underline" :class="{
                  'pointer-events-none text-gray-400 opacity-50': upload.status !== 'completed' && !upload.linked_episode_id,
                  'animate-pulse': upload.status === 'completed' && !upload.linked_episode_id
                }" :title="upload.status !== 'completed' ? 'Настройка доступна после завершения обработки' : ''">
                  {{ upload.linked_episode_id ? 'Управлять' : 'Настроить' }}
                </NuxtLink>
                <button @click="handleDelete(upload.uuid)" title="Удалить загрузку"
                  class="text-gray-400 hover:text-red-600">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd"
                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clip-rule="evenodd" />
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import type { Upload, UploadStatus } from '~/types';

definePageMeta({ middleware: 'auth' });

const { data: uploads, pending, error, refresh } = await useFetch<Upload[]>('/api/v1/account/uploads');

const selectedUploads = ref<string[]>([]);

const unlinkedUploadIds = computed(() =>
  uploads.value?.filter(u => !u.linked_episode_id).map(u => u.uuid) || []
);

const toggleSelectAll = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.checked) {
    selectedUploads.value = [...unlinkedUploadIds.value];
  } else {
    selectedUploads.value = [];
  }
};

const goToBatchEdit = () => {
  if (selectedUploads.value.length === 0) return;
  const idsQuery = selectedUploads.value.join(',');
  navigateTo(`/account/uploads/batch-edit?ids=${idsQuery}`);
};

async function handleDelete(uuid: string) {
  if (!confirm('Вы уверены, что хотите удалить эту загрузку? Связанные сборки также будут удалены.')) return;
  try {
    await $fetch(`/api/v1/account/uploads/${uuid}`, { method: 'DELETE' });
    refresh();
  } catch (e) {
    alert('Ошибка при удалении загрузки');
  }
}

let pollingInterval: NodeJS.Timeout | null = null;

onMounted(() => {
  pollingInterval = setInterval(() => {
    const hasActiveUploads = uploads.value?.some(u => u.status === 'new' || u.status === 'downloading' || u.status === 'processing');
    if (hasActiveUploads) {
      refresh();
    }
  }, 5000);
});

onUnmounted(() => {
  if (pollingInterval) {
    clearInterval(pollingInterval);
  }
});

async function handleRetry(uuid: string) {
  try {
    await $fetch(`/api/v1/account/uploads/${uuid}/retry`, { method: 'POST' });
    refresh(); // Обновляем список, чтобы увидеть изменение статуса
  } catch (e) {
    alert('Не удалось повторить загрузку.');
  }
}

const statusClasses: Record<UploadStatus, string> = {
  new: 'bg-gray-200 text-gray-800',
  downloading: 'bg-blue-100 text-blue-800 animate-pulse',
  processing: 'bg-purple-100 text-purple-800 animate-pulse',
  completed: 'bg-green-100 text-green-800',
  error: 'bg-red-100 text-red-800',
};
</script>