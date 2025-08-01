<template>
    <div>
        <h1 class="text-3xl font-bold mb-4">Мой Диск</h1>

        <div class="flex justify-between items-center mb-4 p-4 bg-gray-50 rounded-lg border">
            <!-- Хлебные крошки -->
            <div class="text-sm">
                <button @click="navigateToNode('root')" class="hover:underline text-blue-600">Корень</button>
                <template v-for="crumb in breadcrumbs" :key="crumb.id">
                    <span class="mx-1 text-gray-400">/</span>
                    <button @click="navigateToNode(crumb.id)" class="hover:underline text-blue-600">{{ crumb.name
                        }}</button>
                </template>
            </div>

            <!-- Кнопки действий -->
            <div class="flex items-center gap-2">
                <!-- Модальное окно невидимо, пока v-model=false. Ошибка "modelValue is missing" исправлена. -->
                <DriveCreateFolderModal v-model="isCreateFolderModalOpen" :current-node-id="currentNodeId"
                    @created="refresh" />

                <UButton icon="i-heroicons-link-20-solid" size="sm" color="neutral" variant="solid"
                    label="Загрузить по URL" disabled />

                <label>
                    <UButton tag="span" icon="i-heroicons-arrow-up-tray-20-solid" size="sm" color="primary"
                        variant="solid" label="Загрузить файл" />
                    <input type="file" multiple @change="handleFileSelect" class="hidden">
                </label>
            </div>
        </div>

        <DriveFileUploader :files-to-upload="filesToUpload" :current-node-id="currentNodeId"
            @upload-complete="handleUploadComplete" />

        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div v-if="pending && !data" class="col-span-full text-center py-10 text-gray-500">Загрузка...</div>

            <div v-for="node in nodes" :key="node.id"
                @dblclick="node.type === 'FOLDER' ? navigateToNode(node.id) : null">
                <DriveItem :item="node" :item-type="getItemType(node)" @deleted="refresh" />
            </div>

            <div v-if="!pending && nodes.length === 0" class="col-span-full text-center py-10 text-gray-500">
                Папка пуста
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { type StorageNode } from '~/types';
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const router = useRouter();
const currentNodeId = ref(parseNodeIdFromQuery(route.query.nodeId));

let refreshInterval: ReturnType<typeof setInterval> | null = null;
onMounted(() => {
    refreshInterval = setInterval(() => {
        const hasProcessingFiles = nodes.value.some(n => n.type === 'FILE' && (n.status === 'PROCESSING' || n.status === 'PENDING'));
        if (hasProcessingFiles) {
            refresh();
        }
    }, 5000);
});
onUnmounted(() => {
    if (refreshInterval) clearInterval(refreshInterval);
});

const { data, pending, refresh } = await useFetch<{
    nodes: StorageNode[];
    breadcrumbs: { id: number, name: string }[];
}>(() => `/api/v1/storage/nodes/${currentNodeId.value}/children`);

const getItemType = (node: StorageNode) => node.type.toLowerCase() as 'folder' | 'file'

const nodes = computed(() => data.value?.nodes || []);
const breadcrumbs = computed(() => data.value?.breadcrumbs || []);

function navigateToNode(nodeId: number | 'root') {
    currentNodeId.value = nodeId;
}
watch(currentNodeId, (newId) => {
    router.push({ query: { nodeId: newId === null ? 'root' : newId } });
});

// --- Модальное окно создания папки ---
const isCreateFolderModalOpen = ref(false);

// --- Загрузка файлов ---
const filesToUpload = ref<File[]>([]);
function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files) {
        filesToUpload.value = Array.from(target.files);
        target.value = '';
    }
}
function handleUploadComplete() {
    refresh();
}

function parseNodeIdFromQuery(queryValue: unknown): number | 'root' {
    if (!queryValue || Array.isArray(queryValue) || queryValue === 'root') {
        return 'root';
    }
    const id = parseInt(String(queryValue), 10);
    return isNaN(id) ? 'root' : id;
};
</script>