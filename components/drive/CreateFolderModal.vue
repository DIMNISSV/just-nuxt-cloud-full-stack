<template>
    <!-- 1. Компонент сам управляет своим состоянием. НИКАКИХ v-model и ui-пропов, ломающих стили. -->
    <UModal>
        <!-- 2. Кнопка-триггер находится в слоте по умолчанию, как и требовалось. -->
        <UButton icon="i-heroicons-folder-plus-20-solid" size="sm" color="neutral" variant="solid"
            label="Новая папка" />

        <!-- 3. Используем правильные именованные слоты для контента. -->
        <template #header>
            <div class="flex items-center justify-between">
                <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
                    Создание новой папки
                </h3>
            </div>
        </template>

        <template #body>
            <UInput v-model="newFolderName" placeholder="Имя папки" autofocus @keyup.enter="handleCreate" />
        </template>

        <!-- 4. Получаем функцию `close` из слота #footer и передаем ее обработчикам. -->
        <template #footer="{ close }">
            <div class="flex gap-3 justify-end">
                <!-- 5. Исправлены все ошибки TS: цвет "neutral" и правильное использование @click. -->
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

// Пропсы принимаются, но v-model больше не нужен.
const props = defineProps<{
    currentNodeId: number | 'root';
}>();

const emit = defineEmits(['created']);

const toast = useToast();
const newFolderName = ref('');
const isLoading = ref(false);

// Убраны все computed-свойства и лишнее управление состоянием.
// Функция handleCreate теперь принимает коллбэк `close` для закрытия окна.
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
                parentId: props.currentNodeId,
            },
        });
        toast.add({ title: 'Папка успешно создана!', color: 'success' });
        emit('created');
        newFolderName.value = ''; // Очищаем поле
        close(); // Закрываем окно после успеха, используя функцию из слота.
    } catch (e: any) {
        toast.add({ title: 'Ошибка!', description: e.data?.message, color: 'error' });
    } finally {
        isLoading.value = false;
    }
}
</script>