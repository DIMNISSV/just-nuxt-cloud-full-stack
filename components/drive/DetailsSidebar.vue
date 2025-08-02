<template>
    <aside v-if="node" class="p-4 border-l bg-white w-80 flex-shrink-0">
        <div class="flex justify-between items-center mb-4">
            <h2 class="font-semibold">Свойства</h2>
            <UButton icon="i-heroicons-x-mark-20-solid" color="neutral" variant="ghost" @click="emit('close')" />
        </div>

        <div class="space-y-4">
            <div class="text-center py-4">
                <div class="text-6xl mb-4 flex justify-center" :class="{
                    'text-yellow-500': node.type === 'FOLDER',
                    'text-gray-500': node.type === 'FILE',
                }">
                    <Icon
                        :name="node.type === 'FOLDER' ? 'heroicons:folder-20-solid' : 'heroicons:document-20-solid'" />
                </div>
                <EditableFieldName :model-value="node.name" :node-id="node.id" @renamed="emit('renamed')" />
            </div>

            <hr class="border-gray-200" />

            <div class="space-y-2 text-sm text-gray-600">
                <div class="flex justify-between">
                    <span>Тип:</span>
                    <span class="font-medium text-gray-900">{{ node.type === 'FOLDER' ? 'Папка' : 'Файл' }}</span>
                </div>
                <div v-if="node.type === 'FILE' && node.sizeBytes" class="flex justify-between">
                    <span>Размер:</span>
                    <span class="font-medium text-gray-900">{{ formatBytes(node.sizeBytes) }}</span>
                </div>
                <div class="flex justify-between">
                    <span>Создан:</span>
                    <span class="font-medium text-gray-900">{{ new Date(node.createdAt).toLocaleDateString() }}</span>
                </div>
                <div class="flex justify-between">
                    <span>Изменен:</span>
                    <span class="font-medium text-gray-900">{{ new Date(node.updatedAt).toLocaleDateString() }}</span>
                </div>
            </div>

            <hr class="border-gray-200" />

            <div class="space-y-2">
                <UButton icon="i-heroicons-trash-20-solid" color="error" variant="outline" block label="Удалить"
                    @click="emit('deleted', node.id)" />
            </div>
        </div>
    </aside>
</template>

<script setup lang="ts">
import type { StorageNode } from '~/types';
import EditableFieldName from './EditableFieldName.vue';

const props = defineProps<{
    node: StorageNode | null;
}>();

const emit = defineEmits(['close', 'deleted', 'renamed']);

function formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
</script>