<template>
    <div v-if="uploadQueue.length > 0" class="mb-4 p-4 border rounded-lg bg-white space-y-3">
        <h3 class="font-semibold text-sm">Активные загрузки</h3>
        <div v-for="item in uploadQueue" :key="item.id" class="text-sm">
            <p class="truncate">{{ item.file.name }}</p>
            <div v-if="item.error" class="text-red-500">{{ item.error }}</div>
            <div v-else class="flex items-center gap-2">
                <UProgress :value="item.progress" />
                <span class="text-xs text-gray-500">{{ Math.round(item.progress) }}%</span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

interface UploadQueueItem {
    id: number;
    file: File;
    progress: number;
    error: string | null;
}

interface RequestUploadResponse {
    nodeUuid: string; // ★ ИЗМЕНЕНИЕ: Получаем UUID
    uploadUrl: string;
}

const props = defineProps<{
    filesToUpload: File[];
    currentParentUuid: string | null; // ★ ИЗМЕНЕНИЕ: Принимаем UUID
}>();
const emit = defineEmits(['upload-complete']);

const toast = useToast();
const uploadQueue = ref<UploadQueueItem[]>([]);
let nextId = 0;

watch(() => props.filesToUpload, (newFiles) => {
    if (newFiles.length === 0) return;
    uploadQueue.value = []; // Очищаем старую очередь
    newFiles.forEach(file => {
        const queueItem: UploadQueueItem = { id: nextId++, file, progress: 0, error: null };
        uploadQueue.value.push(queueItem);
        startUpload(queueItem);
    });
}, { deep: true });

async function startUpload(item: UploadQueueItem) {
    try {
        const { nodeUuid, uploadUrl } = await $fetch<RequestUploadResponse>('/api/v1/storage/nodes/request-upload-url', {
            method: 'POST',
            body: {
                filename: item.file.name,
                sizeBytes: item.file.size,
                mimeType: item.file.type || 'application/octet-stream',
                parentUuid: props.currentParentUuid, // ★ ИЗМЕНЕНИЕ: Отправляем UUID
            },
        });

        await new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('PUT', uploadUrl);
            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    item.progress = (event.loaded / event.total) * 100;
                }
            };
            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    item.progress = 100;
                    resolve();
                } else {
                    reject(new Error(`Ошибка загрузки: ${xhr.statusText}`));
                }
            };
            xhr.onerror = () => reject(new Error('Сетевая ошибка при загрузке.'));
            xhr.send(item.file);
        });

        // ★ ИЗМЕНЕНИЕ: Финализируем по UUID
        await $fetch(`/api/v1/storage/nodes/${nodeUuid}/finalize-upload`, { method: 'POST' });

        uploadQueue.value = uploadQueue.value.filter(q => q.id !== item.id);
        if (uploadQueue.value.length === 0) {
            emit('upload-complete');
        }
    } catch (e: any) {
        item.error = e.data?.message || 'Неизвестная ошибка';
        toast.add({ title: `Ошибка при загрузке ${item.file.name}`, description: item.error!, color: 'error' });
    }
}
</script>