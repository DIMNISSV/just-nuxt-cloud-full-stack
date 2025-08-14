<template>
    <aside v-if="node"
        class="fixed inset-0 z-40 bg-white p-4 transition-transform md:relative md:z-auto md:w-80 md:flex-shrink-0 md:border-l md:p-4"
        :class="{ 'translate-x-0': node, 'translate-x-full': !node }">
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
                <EditableFieldName :model-value="node.name" :node-uuid="node.uuid" @renamed="emit('renamed')"
                    @click.stop />
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
                <UButton v-if="node.type === 'FILE'" @click="handleDownloadClick"
                    icon="i-heroicons-arrow-down-tray-20-solid" color="primary" variant="outline" block label="Скачать" />
                <UButton icon="i-heroicons-trash-20-solid" color="error" variant="outline" block label="Удалить"
                    @click="node && emit('deleted', node.uuid)" />
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

const handleDownloadClick = () => {
    if (props.node) {
        navigateTo(`/drive/${props.node.uuid}/download`, { open: { target: '_blank' } });
    }
};

function formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
</script>