<template>
  <div class="relative group p-3 text-center border rounded-lg hover:bg-gray-100 cursor-pointer transition">
    <!-- Иконка -->
    <div class="text-5xl mb-2 flex justify-center" :class="{ 'text-yellow-500': itemType === 'folder', 'text-gray-500': itemType === 'file' }">
      <Icon :name="itemType === 'folder' ? 'heroicons:folder-20-solid' : 'heroicons:document-20-solid'" />
    </div>
    
    <!-- Имя -->
    <p class="text-sm truncate" :title="itemName">{{ itemName }}</p>

    <!-- Меню действий -->
    <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
      <button @click.stop="deleteItem" class="p-1 rounded-full hover:bg-red-100 text-gray-500 hover:text-red-600">
        <Icon name="heroicons:trash-20-solid" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PersonalFolder, PersonalFileMeta, StorageItem as StorageItemType } from '~/types';

const props = defineProps<{
  item: PersonalFolder | PersonalFileMeta;
  itemType: 'folder' | 'file';
}>();

const emit = defineEmits(['deleted']);

const itemName = computed(() => {
    return props.itemType === 'folder' ? (props.item as PersonalFolder).name : (props.item as PersonalFileMeta).asset!.originalFilename;
});

async function deleteItem() {
  const confirmMessage = props.itemType === 'folder'
    ? 'Вы уверены, что хотите удалить эту папку и все ее содержимое?'
    : 'Вы уверены, что хотите удалить этот файл?';

  if (!confirm(confirmMessage)) return;

  try {
    if (props.itemType === 'folder') {
      await $fetch(`/api/v1/storage/folder/${props.item.id}`, { method: 'DELETE' });
    } else {
      await $fetch(`/api/v1/storage/asset/${(props.item as PersonalFileMeta).assetId}`, { method: 'DELETE' });
    }
    emit('deleted');
  } catch (e) {
    alert('Ошибка при удалении');
  }
}
</script>