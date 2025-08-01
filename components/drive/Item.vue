<template>
  <div class="relative group p-3 text-center border rounded-lg hover:bg-gray-100 cursor-pointer transition">

    <div v-if="fileStatus && fileStatus !== 'AVAILABLE'"
      class="absolute inset-0 bg-white bg-opacity-70 flex flex-col items-center justify-center rounded-lg z-10">
      <template v-if="fileStatus === 'PROCESSING' || fileStatus === 'PENDING'">
        <Icon name="heroicons:arrow-path-20-solid" class="text-3xl text-blue-500 animate-spin" />
        <span class="text-xs mt-1 text-blue-600">{{ fileStatus === 'PENDING' ? 'В очереди' : 'Обработка...' }}</span>
      </template>
      <template v-if="fileStatus === 'ERROR'">
        <Icon name="heroicons:exclamation-triangle-20-solid" class="text-3xl text-red-500" />
        <span class="text-xs mt-1 text-red-600">Ошибка</span>
      </template>
    </div>

    <div class="text-5xl mb-2 flex justify-center"
      :class="{ 'text-yellow-500': itemType === 'folder', 'text-gray-500': itemType === 'file' }">
      <Icon :name="itemType === 'folder' ? 'heroicons:folder-20-solid' : 'heroicons:document-20-solid'" />
    </div>

    <p class="text-sm truncate" :title="item.name">{{ item.name }}</p>

    <!-- Меню удаления пока закомментируем, т.к. API еще не готово -->
    <!--
    <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition z-20">
      <button @click.stop="deleteItem" class="p-1 rounded-full hover:bg-red-100 text-gray-500 hover:text-red-600">
        <Icon name="heroicons:trash-20-solid" />
      </button>
    </div>
    -->
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
// ★ ИЗМЕНЕНИЕ: Импортируем новый главный тип
import type { StorageNode } from '~/types';

const props = defineProps<{
  item: StorageNode;
  itemType: 'folder' | 'file';
}>();

const emit = defineEmits(['deleted']);
const toast = useToast();

const fileStatus = computed(() => {
  if (props.itemType === 'file') {
    return props.item.status;
  }
  return null;
});

/*
async function deleteItem() {
  // TODO: Реализовать в следующем коммите
}
*/
</script>