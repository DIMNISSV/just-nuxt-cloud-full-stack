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

// Локальный интерфейс для отслеживания состояния каждого файла в очереди
interface UploadQueueItem {
    id: number;
    file: File;
    progress: number;
    error: string | null;
}

// Ожидаемый ответ от API для запроса URL на загрузку
interface RequestUploadResponse {
    nodeId: number;
    uploadUrl: string;
}

const props = defineProps<{
    filesToUpload: File[];
    currentNodeId: number | 'root';
}>();
const emit = defineEmits(['upload-complete']);

const toast = useToast();
const uploadQueue = ref<UploadQueueItem[]>([]);
let nextId = 0;

// Этот наблюдатель реагирует на выбор новых файлов в родительском компоненте
watch(() => props.filesToUpload, (newFiles) => {
    if (newFiles.length === 0) return;

    newFiles.forEach(file => {
        const queueItem: UploadQueueItem = {
            id: nextId++,
            file,
            progress: 0,
            error: null,
        };
        uploadQueue.value.push(queueItem);
        startUpload(queueItem); // Запускаем загрузку для каждого нового файла
    });
}, { deep: true });

async function startUpload(item: UploadQueueItem) {
    try {
        // Шаг 1: Запрашиваем у нашего бэкенда pre-signed URL для прямой загрузки в S3
        const { nodeId, uploadUrl } = await $fetch<RequestUploadResponse>('/api/v1/storage/nodes/request-upload-url', {
            method: 'POST',
            body: {
                filename: item.file.name,
                sizeBytes: item.file.size,
                mimeType: item.file.type || 'application/octet-stream',
                parentId: props.currentNodeId,
            },
        });


        // Шаг 2: Выполняем прямую загрузку в S3 (MinIO) с помощью XMLHttpRequest для отслеживания прогресса
        await new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('PUT', uploadUrl);

            // Обновляем прогресс в UI
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

        // Шаг 3: Сообщаем нашему бэкенду, что загрузка завершена, чтобы он мог финализировать файл
        await $fetch(`/api/v1/storage/nodes/${nodeId}/finalize-upload`, { method: 'POST' });

        // Удаляем успешно загруженный файл из очереди
        uploadQueue.value = uploadQueue.value.filter(q => q.id !== item.id);

        // Если это был последний файл в очереди, сообщаем родителю, чтобы он обновил список
        if (uploadQueue.value.length === 0) {
            emit('upload-complete');
        }

    } catch (e: any) {
        item.error = e.data?.message || 'Неизвестная ошибка';
        toast.add({ title: `Ошибка при загрузке ${item.file.name}`, description: item.error!, color: 'error' });
    }
}
</script>