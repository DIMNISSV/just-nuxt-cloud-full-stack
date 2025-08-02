<template>
  <UModal>
    <!-- Кнопка-триггер -->
    <UButton icon="i-heroicons-arrow-up-tray-20-solid" size="sm" color="primary" variant="solid"
      label="Загрузить файл" />

    <!-- Заголовок -->
    <template #header>
      <h3 class="text-base font-semibold text-gray-900">Загрузка файлов</h3>
    </template>

    <!-- Тело модального окна с зоной для D&D -->
    <template #body>
      <div class="space-y-4">
        <label @dragover.prevent @dragleave.prevent="isDragOver = false" @dragenter.prevent="isDragOver = true"
          @drop.prevent="handleFileDrop"
          class="flex flex-col items-center justify-center w-full h-32 px-4 text-center border-2 border-dashed rounded-lg cursor-pointer transition-colors"
          :class="isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'">
          <Icon name="heroicons:cloud-arrow-up-20-solid" class="w-8 h-8 text-gray-500" />
          <p class="mt-1 text-sm text-gray-500">
            <span class="font-semibold">Перетащите файлы</span> или нажмите для выбора
          </p>
          <input type="file" multiple class="hidden" @change="handleFileSelect">
        </label>

        <!-- Список выбранных файлов -->
        <div v-if="selectedFiles.length > 0" class="space-y-2 max-h-48 overflow-y-auto pr-2">
          <div v-for="(file, index) in selectedFiles" :key="index"
            class="flex items-center justify-between text-sm p-2 bg-gray-100 rounded">
            <span class="truncate">{{ file.name }}</span>
            <button @click="removeFile(index)"
              class="p-1 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-600">
              <Icon name="heroicons:x-mark-20-solid" />
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- Футер с кнопками действий -->
    <template #footer="{ close }">
      <div class="flex justify-end gap-3">
        <UButton label="Отмена" color="neutral" variant="solid" @click="close" />
        <UButton label="Начать загрузку" color="primary" variant="solid" :disabled="selectedFiles.length === 0"
          @click="startUpload(close)" />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const emit = defineEmits(['upload-started']);

const selectedFiles = ref<File[]>([]);
const isDragOver = ref(false);

const addFiles = (files: FileList) => {
  selectedFiles.value.push(...Array.from(files));
};

const handleFileDrop = (event: DragEvent) => {
  isDragOver.value = false;
  if (event.dataTransfer?.files) {
    addFiles(event.dataTransfer.files);
  }
};

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files) {
    addFiles(target.files);
    target.value = ''; // Сброс для повторного выбора того же файла
  }
};

const removeFile = (index: number) => {
  selectedFiles.value.splice(index, 1);
};

const startUpload = (close: () => void) => {
  if (selectedFiles.value.length === 0) return;
  // Отправляем выбранные файлы родителю
  emit('upload-started', selectedFiles.value);
  // Очищаем список и закрываем окно
  selectedFiles.value = [];
  close();
};
</script>