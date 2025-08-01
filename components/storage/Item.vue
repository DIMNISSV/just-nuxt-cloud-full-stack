<template>
  <div class="relative group p-3 text-center border rounded-lg hover:bg-gray-100 cursor-pointer transition">

    <!-- ★ ИЗМЕНЕНИЕ: Используем новое computed-свойство. Теперь TypeScript счастлив. -->
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

    <!-- Остальная часть шаблона без изменений -->
    <div class="text-5xl mb-2 flex justify-center"
      :class="{ 'text-yellow-500': itemType === 'folder', 'text-gray-500': itemType === 'file' }">
      <Icon :name="itemType === 'folder' ? 'heroicons:folder-20-solid' : 'heroicons:document-20-solid'" />
    </div>
    <p class="text-sm truncate" :title="itemName">{{ itemName }}</p>
    <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition z-20">
      <button @click.stop="deleteItem" class="p-1 rounded-full hover:bg-red-100 text-gray-500 hover:text-red-600">
        <Icon name="heroicons:trash-20-solid" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { PersonalFolder, PersonalFileMeta } from '~/types';

const toast = useToast()

const props = defineProps<{
  item: PersonalFolder | PersonalFileMeta;
  itemType: 'folder' | 'file';
}>();

const emit = defineEmits(['deleted']);

const fileStatus = computed(() => {
  if (props.itemType === 'file') {
    return (props.item as PersonalFileMeta).asset?.status;
  }
  return null; // Для папок статуса нет
});

const itemName = computed(() => {
  return props.itemType === 'folder'
    ? (props.item as PersonalFolder).name
    : (props.item as PersonalFileMeta).asset!.originalFilename;
});

async function deleteItem() {
  // ★ ИЗМЕНЕНИЕ: Разрешаем удаление для PENDING, блокируем только для PROCESSING
  if (fileStatus.value === 'PROCESSING') {
    toast.add({ title: 'Действие запрещено', description: 'Нельзя удалить файл, пока он находится в обработке.', color: 'warning' });
    return;
  }

  const confirmMessage = props.itemType === 'folder'
    ? 'Вы уверены, что хотите удалить эту папку и все ее содержимое?'
    : `Вы уверены, что хотите удалить этот файл? ${fileStatus.value === 'PENDING' ? '(Это также отменит его загрузку из очереди)' : ''}`;

  if (!confirm(confirmMessage)) return;

  try {
    if (props.itemType === 'folder') {
      await $fetch(`/api/v1/storage/folder/${props.item.id}`, { method: 'DELETE' });
    } else {
      await $fetch(`/api/v1/storage/asset/${(props.item as PersonalFileMeta).assetId}`, { method: 'DELETE' });
    }
    emit('deleted');
    toast.add({ title: 'Успешно удалено', color: 'success' });
  } catch (e: any) {
    toast.add({ title: 'Ошибка при удалении', description: e.data?.message, color: 'error' });
  }
}
</script>