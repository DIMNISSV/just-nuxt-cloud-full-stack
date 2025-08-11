<template>
    <div class="flex h-full">
        <div class="flex-grow p-6" ref="mainAreaRef">
            <h1 class="text-3xl font-bold mb-4">Мой Диск</h1>
            <!-- Панель навигации и кнопок -->
            <div class="flex justify-between items-center mb-4 p-4 bg-gray-50 rounded-lg border">
                <!-- Хлебные крошки -->
                <div class="text-sm">
                    <button @click="navigateToNode(null)" class="hover:underline text-blue-600">Корень</button>
                    <template v-for="crumb in breadcrumbs" :key="crumb.uuid">
                        <span class="mx-1 text-gray-400">/</span>
                        <button @click="navigateToNode(crumb.uuid)" class="hover:underline text-blue-600">{{ crumb.name
                        }}</button>
                    </template>
                </div>
                <!-- Кнопки действий -->
                <div class="flex items-center gap-2">
                    <DriveCreateFolderModal :current-parent-uuid="currentUuid" @created="refresh" />
                    <DriveUrlDownloadModal :current-parent-uuid="currentUuid" @submitted="refresh" />
                    <DriveUploadModal @upload-started="onUploadStarted" />
                </div>
            </div>

            <!-- Компонент для активных загрузок -->
            <DriveFileUploader ref="fileUploaderRef" :current-parent-uuid="currentUuid"
                @upload-complete="handleUploadComplete" />

            <!-- Сетка с файлами и папками -->
            <div v-if="pending && !data" class="col-span-full text-center py-10 text-gray-500">Загрузка...</div>
            <div v-else-if="!pending && nodes.length === 0" class="col-span-full text-center py-10 text-gray-500">
                Папка пуста
            </div>
            <div v-else class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <div v-for="node in nodes" :key="node.uuid" @click.prevent="handleMouseClick(node)"
                    @dblclick="handleDoubleClick(node)" @touchstart.passive="handleTouchStart(node)"
                    @touchend.prevent="handleTouchEnd(node)" @touchmove.passive="handleTouchMove">
                    <DriveItem :item="node" :item-type="getItemType(node)"
                        :is-selected="selectedNode?.uuid === node.uuid" />
                </div>
            </div>
        </div>

        <!-- Боковая панель со свойствами -->
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
import DriveUrlDownloadModal from '~/components/drive/UrlDownloadModal.vue'; // <-- Теперь импортируем правильный компонент
import DriveDetailsSidebar from '~/components/drive/DetailsSidebar.vue';
import type DriveFileUploader from '~/components/drive/FileUploader.vue';

// Middleware 'auth' проверяет, что пользователь авторизован для доступа к этой странице
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const router = useRouter();
const toast = useToast();

const currentUuid = ref<string | null>(route.query.folder as string || null);
const selectedNode = ref<StorageNode | null>(null);
const mainAreaRef = ref<HTMLElement | null>(null);
const longPressTimer = ref<NodeJS.Timeout | null>(null);
const fileUploaderRef = ref<InstanceType<typeof DriveFileUploader> | null>(null);

const apiUrl = computed(() => {
    return currentUuid.value ? `/api/v1/storage/nodes/${currentUuid.value}/children` : '/api/v1/storage/nodes/root/children';
});

const { data, pending, refresh } = await useFetch<{
    nodes: StorageNode[];
    breadcrumbs: { uuid: string, name: string }[];
}>(apiUrl, { watch: [apiUrl] });

const nodes = computed(() => data.value?.nodes || []);
const breadcrumbs = computed(() => data.value?.breadcrumbs || []);

const onUploadStarted = (files: File[]) => {
    fileUploaderRef.value?.startNewUpload(files);
}

onClickOutside(mainAreaRef, (event) => {
    // Не закрывать сайдбар, если клик был внутри него
    if ((event.target as HTMLElement).closest('.md\\:w-80')) return;
    selectedNode.value = null;
});

const getItemType = (node: StorageNode) => node.type.toLowerCase() as 'folder' | 'file';
const selectNode = (node: StorageNode) => { selectedNode.value = node; };
const handleMouseClick = (node: StorageNode) => { selectNode(node); };
const handleDoubleClick = (node: StorageNode) => { navigateOnNode(node); };

const handleTouchStart = (node: StorageNode) => {
    longPressTimer.value = setTimeout(() => {
        selectNode(node);
        longPressTimer.value = null;
    }, 500); // 500ms для долгого нажатия
};
const handleTouchEnd = (node: StorageNode) => {
    if (longPressTimer.value) { // Если таймер не сработал, это был быстрый тап
        clearTimeout(longPressTimer.value);
        longPressTimer.value = null;
        navigateOnNode(node);
    }
};
const handleTouchMove = () => { // Если пользователь начал двигать палец, отменяем долгое нажатие
    if (longPressTimer.value) {
        clearTimeout(longPressTimer.value);
        longPressTimer.value = null;
    }
};

const navigateOnNode = (node: StorageNode) => {
    if (node.type === 'FOLDER') {
        navigateToNode(node.uuid);
    } else {
        toast.add({ title: `Предпросмотр для "${node.name}" пока не реализован.` });
    }
};
const navigateToNode = (uuid: string | null) => {
    selectedNode.value = null;
    currentUuid.value = uuid;
};

const handleDelete = async (uuid: string) => {
    if (confirm('Вы уверены, что хотите удалить этот объект? Это действие необратимо.')) {
        try {
            await $fetch(`/api/v1/storage/nodes/${uuid}`, { method: 'DELETE' });
            toast.add({ title: 'Объект успешно удален', color: 'success' });
            selectedNode.value = null;
            refresh();
        } catch (e: any) {
            toast.add({ title: 'Ошибка удаления!', description: e.data?.message, color: 'error' });
        }
    }
};
const handleRenameSuccess = async () => {
    const renamedNodeUuid = selectedNode.value?.uuid;
    if (!renamedNodeUuid) return;
    await refresh();
    await nextTick();
    const updatedNode = nodes.value.find(n => n.uuid === renamedNodeUuid);
    selectedNode.value = updatedNode || null;
};
const handleUploadComplete = () => { refresh(); };

watch(currentUuid, (newUuid) => {
    router.push({ query: { folder: newUuid || undefined } });
});

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
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
});
</script>