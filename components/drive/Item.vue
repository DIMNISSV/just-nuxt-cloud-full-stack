<template>
  <!-- Обычный div, без UDropdown. Класс 'selected' добавляется динамически -->
  <div class="relative group p-3 text-center border rounded-lg hover:bg-gray-100 cursor-pointer transition" :class="{
    'bg-blue-50 border-blue-400 ring-2 ring-blue-300': isSelected,
    'bg-white': !isSelected
  }">

    <div v-if="fileStatus && fileStatus !== 'AVAILABLE'"
      class="absolute inset-0 bg-white bg-opacity-70 flex flex-col items-center justify-center rounded-lg z-10">
      <!-- ... (отображение статусов без изменений) ... -->
    </div>

    <div class="text-5xl mb-2 flex justify-center" :class="{
      'text-yellow-500': itemType === 'folder',
      'text-gray-500': itemType === 'file',
    }">
      <Icon :name="itemType === 'folder'
        ? 'heroicons:folder-20-solid'
        : 'heroicons:document-20-solid'
        " />
    </div>

    <p class="text-sm truncate" :title="item.name">{{ item.name }}</p>

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { StorageNode } from '~/types';

const props = defineProps<{
  item: StorageNode;
  itemType: 'folder' | 'file';
  isSelected: boolean; // ★ НОВОЕ: Проп для определения, выбран ли элемент
}>();

// ★ УДАЛЕНО: Вся логика с dropdownItems и emit'ами 'rename', 'deleted' убрана.

const fileStatus = computed(() => {
  if (props.itemType === 'file') {
    return props.item.status;
  }
  return null;
});
</script>