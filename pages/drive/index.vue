<template>
    <div class="flex h-full">

        <!-- Основная область с файлами -->
        <div class="flex-grow p-6" ref="mainAreaRef">
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
                    <DriveCreateFolderModal :current-node-id="currentNodeId" @created="refresh" />
                    <DriveUploadModal :current-node-id="currentNodeId" @upload-started="onUploadStarted" />
                </div>
            </div>

            <DriveFileUploader :files-to-upload="filesToUpload" :current-node-id="currentNodeId"
                @upload-complete="handleUploadComplete" />

            <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <div v-if="pending && !data" class="col-span-full text-center py-10 text-gray-500">Загрузка...</div>

                <!-- ★ ИЗМЕНЕНИЕ: Полностью переработанные обработчики событий -->
                <div v-for="node in nodes" :key="node.id" @click.prevent="handleMouseClick(node)"
                    @dblclick="handleDoubleClick(node)" @touchstart.passive="handleTouchStart(node)"
                    @touchend.prevent="handleTouchEnd(node)" @touchmove.passive="handleTouchMove">
                    <DriveItem :item="node" :item-type="getItemType(node)"
                        :is-selected="selectedNode?.id === node.id" />
                </div>

                <div v-if="!pending && nodes.length === 0" class="col-span-full text-center py-10 text-gray-500">
                    Папка пуста
                </div>
            </div>
        </div>

        <!-- Боковая панель с деталями -->
        <DriveDetailsSidebar :node="selectedNode" @close="selectedNode = null" @deleted="handleDelete"
            @renamed="handleRenameSuccess" />
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { onClickOutside } from '@vueuse/core';
import { type StorageNode } from '~/types';
import DriveUploadModal from '~/components/drive/UploadModal.vue';
import DriveCreateFolderModal from '~/components/drive/CreateFolderModal.vue';
import DriveDetailsSidebar from '~/components/drive/DetailsSidebar.vue';

definePageMeta({ middleware: 'auth' });

const route = useRoute();
const router = useRouter();
const toast = useToast();

const currentNodeId = ref(parseNodeIdFromQuery(route.query.nodeId));
const filesToUpload = ref<File[]>([]);
const selectedNode = ref<StorageNode | null>(null);
const mainAreaRef = ref<HTMLElement | null>(null);

// ★ НОВОЕ: Упрощенная логика для обработки касаний
const longPressTimer = ref<NodeJS.Timeout | null>(null);

const { data, pending, refresh } = await useFetch<{
    nodes: StorageNode[];
    breadcrumbs: { id: number, name: string }[];
}>(() => `/api/v1/storage/nodes/${currentNodeId.value}/children`);

const nodes = computed(() => data.value?.nodes || []);
const breadcrumbs = computed(() => data.value?.breadcrumbs || []);

onClickOutside(mainAreaRef, (event) => {
    if ((event.target as HTMLElement).closest('.md\\:w-80')) return;
    selectedNode.value = null;
});

const getItemType = (node: StorageNode) => node.type.toLowerCase() as 'folder' | 'file';
const selectNode = (node: StorageNode) => { selectedNode.value = node; };

// --- Обработчики событий ---

// Вызывается при старте касания
const handleTouchStart = (node: StorageNode) => {
    longPressTimer.value = setTimeout(() => {
        selectNode(node); // Если палец задержали - открываем сайдбар
        longPressTimer.value = null; // Помечаем, что таймер сработал
    }, 500);
};

// Вызывается, когда палец убирают с экрана
const handleTouchEnd = (node: StorageNode) => {
    // Если таймер еще не сработал, значит это был короткий тап
    if (longPressTimer.value) {
        clearTimeout(longPressTimer.value);
        longPressTimer.value = null;
        navigateTo(node); // Выполняем навигацию
    }
    // Если таймер уже сработал (longPressTimer.value === null), ничего не делаем,
    // так как действие (открытие сайдбара) уже выполнено.
};

// Вызывается при движении пальца - отменяет долгое нажатие
const handleTouchMove = () => {
    if (longPressTimer.value) {
        clearTimeout(longPressTimer.value);
        longPressTimer.value = null;
    }
};

// Этот обработчик будет вызван только мышью, т.к. touch-события его предотвращают
const handleMouseClick = (node: StorageNode) => {
    selectNode(node);
};

// Двойной клик работает только для мыши
const handleDoubleClick = (node: StorageNode) => {
    navigateTo(node);
};

// --- Вспомогательные и основные функции ---

const navigateTo = (node: StorageNode) => {
    if (node.type === 'FOLDER') {
        navigateToNode(node.id);
    } else {
        toast.add({ title: `Предпросмотр для "${node.name}" пока не реализован.` });
    }
};

const navigateToNode = (nodeId: number | 'root') => {
    selectedNode.value = null;
    currentNodeId.value = nodeId;
};

const handleDelete = async (nodeId: number) => {
    if (confirm('Вы уверены, что хотите удалить этот объект? Это действие необратимо.')) {
        try {
            await $fetch(`/api/v1/storage/nodes/${nodeId}`, { method: 'DELETE' });
            toast.add({ title: 'Объект успешно удален', color: 'success' });
            selectedNode.value = null;
            refresh();
        } catch (e: any) {
            toast.add({ title: 'Ошибка удаления!', description: e.data?.message, color: 'error' });
        }
    }
};

const handleRenameSuccess = async () => {
    const renamedNodeId = selectedNode.value?.id;
    if (!renamedNodeId) return;
    await refresh();
    await nextTick();
    const updatedNode = nodes.value.find(n => n.id === renamedNodeId);
    selectedNode.value = updatedNode || null;
};

const onUploadStarted = (files: File[]) => { filesToUpload.value = files; };
const handleUploadComplete = () => { refresh(); };

watch(currentNodeId, (newId) => {
    router.push({ query: { nodeId: newId === 'root' ? undefined : newId } });
});

function parseNodeIdFromQuery(queryValue: unknown): number | 'root' {
    if (!queryValue || Array.isArray(queryValue) || queryValue === 'root') return 'root';
    const id = parseInt(String(queryValue), 10);
    return isNaN(id) ? 'root' : id;
};

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
</script>