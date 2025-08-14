<template>
    <UModal>
        <UButton icon="i-heroicons-folder-plus-20-solid" size="sm" color="neutral" variant="solid"
            label="Новая папка" />
        <template #header>
            <h3 class="text-base font-semibold">Создание новой папки</h3>
        </template>
        <template #body>
            <UInput v-model="newFolderName" placeholder="Имя папки" autofocus @keyup.enter="handleCreate" />
        </template>
        <template #footer="{ close }">
            <div class="flex gap-3 justify-end">
                <UButton label="Отмена" color="neutral" variant="solid" @click="close" />
                <UButton label="Создать" color="primary" variant="solid" :loading="isLoading"
                    @click="handleCreate(close)" />
            </div>
        </template>
    </UModal>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { NodeType } from '~/types';

const props = defineProps<{
    currentParentUuid: string | null;
}>();

const emit = defineEmits(['created']);
const toast = useToast();
const newFolderName = ref('');
const isLoading = ref(false);

async function handleCreate(close: () => void) {
    if (!newFolderName.value.trim()) {
        toast.add({ title: 'Имя папки не может быть пустым', color: 'error' });
        return;
    }
    isLoading.value = true;
    try {
        await $fetch('/api/v1/storage/nodes', {
            method: 'POST',
            body: {
                name: newFolderName.value,
                type: NodeType.FOLDER,
                parentUuid: props.currentParentUuid, 
            },
        });
        toast.add({ title: 'Папка успешно создана!', color: 'success' });
        emit('created');
        newFolderName.value = '';
        close();
    } catch (e: any) {
        toast.add({ title: 'Ошибка!', description: e.data?.message, color: 'error' });
    } finally {
        isLoading.value = false;
    }
}
</script>