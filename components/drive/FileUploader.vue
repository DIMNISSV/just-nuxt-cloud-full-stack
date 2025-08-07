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
import { ref, nextTick } from 'vue'; // ★ ИЗМЕНЕНИЕ: Импортируем nextTick

interface UploadQueueItem {
    id: number;
    file: File;
    progress: number;
    error: string | null;
}

interface RequestUploadResponse {
    nodeUuid: string;
    uploadUrl: string;
}

const props = defineProps<{
    currentParentUuid: string | null;
}>();
const emit = defineEmits(['upload-complete']);

const toast = useToast();
const uploadQueue = ref<UploadQueueItem[]>([]);
let nextId = 0;

// ★ ИЗМЕНЕНИЕ: Логика полностью переписана для надежности
const startNewUpload = async (files: File[]) => {
    if (files.length === 0) return;

    // Шаг 1: Подготавливаем очередь и обновляем реактивное состояние
    const newQueue: UploadQueueItem[] = [];
    for (const file of files) {
        newQueue.push({ id: nextId++, file, progress: 0, error: null });
    }
    uploadQueue.value = newQueue;

    // Шаг 2: Ждем, пока Vue ГАРАНТИРОВАННО обновит DOM
    // UI с прогресс-барами появится на экране
    await nextTick();

    // Шаг 3: Теперь, когда UI виден, запускаем реальные загрузки
    const uploadPromises = uploadQueue.value.map(item => startUpload(item));
    await Promise.all(uploadPromises);

    // Этот emit сработает, только когда все загрузки в пакете завершатся
    if (uploadQueue.value.every(item => item.progress === 100)) {
        emit('upload-complete');
    }
};

defineExpose({
    startNewUpload
});

async function startUpload(item: UploadQueueItem) {
    try {
        const { nodeUuid, uploadUrl } = await $fetch<RequestUploadResponse>('/api/v1/storage/nodes/request-upload-url', {
            method: 'POST',
            body: {
                filename: item.file.name,
                sizeBytes: item.file.size,
                mimeType: item.file.type || 'application/octet-stream',
                parentUuid: props.currentParentUuid,
            },
        });

        await new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('PUT', uploadUrl, true);

            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    item.progress = (event.loaded / event.total) * 100;
                }
            };

            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    item.progress = 100;
                    // Мы финализируем здесь, чтобы связать успешную загрузку с финализацией
                    $fetch(`/api/v1/storage/nodes/${nodeUuid}/finalize-upload`, { method: 'POST' })
                        .then(() => resolve())
                        .catch(reject);
                } else {
                    const errorText = xhr.responseText || `Ошибка загрузки: ${xhr.statusText}`;
                    reject(new Error(errorText));
                }
            };
            xhr.onerror = () => reject(new Error('Сетевая ошибка при загрузке в хранилище.'));
            xhr.send(item.file);
        });

    } catch (e: any) {
        const errorMessage = e.data?.message || e.message || 'Неизвестная ошибка';
        item.error = errorMessage;
        toast.add({ title: `Ошибка при загрузке ${item.file.name}`, description: errorMessage, color: 'error' });
    }
}
</script>