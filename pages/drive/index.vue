<template>
    <div>
        <!-- ★ ИЗМЕНЕНИЕ: Обновляем заголовок -->
        <h1 class="text-3xl font-bold mb-4">Мой Диск</h1>

        <!-- Панель управления -->
        <div class="flex justify-between items-center mb-4 p-4 bg-gray-50 rounded-lg border">
            <!-- Хлебные крошки -->
            <div class="text-sm">
                <!-- ★ ИЗМЕНЕНИЕ: navigateToNode вместо navigateToFolder -->
                <button @click="navigateToNode('root')" class="hover:underline text-blue-600">Корень</button>
                <template v-for="crumb in breadcrumbs" :key="crumb.id">
                    <span class="mx-1 text-gray-400">/</span>
                    <button @click="navigateToNode(crumb.id)" class="hover:underline text-blue-600">{{ crumb.name
                        }}</button>
                </template>
            </div>

            <!-- Кнопки действий -->
            <div class="flex items-center gap-2">
                <button @click="isCreateFolderModalOpen = true"
                    class="px-3 py-1.5 text-sm bg-gray-200 rounded-md hover:bg-gray-300">
                    + Новая папка
                </button>

                <!-- Кнопки загрузки пока оставляем, но они не будут работать до следующего коммита -->
                <button @click="isUrlDownloadModalOpen = true" disabled
                    class="px-3 py-1.5 text-sm bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed">
                    <Icon name="heroicons:link-20-solid" class="mr-1" />
                    Загрузить по URL
                </button>

                <label for="file-upload-input"
                    class="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer opacity-50 cursor-not-allowed">
                    Загрузить файл
                </label>
                <input id="file-upload-input" type="file" multiple class="hidden" disabled>
            </div>
        </div>

        <!-- ★ ИЗМЕНЕНИЕ: Убираем старый FileUploader, т.к. он не работает -->
        <!-- <StorageFileUploader ... /> -->

        <!-- Список файлов и папок -->
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div v-if="pending && !data" class="col-span-full text-center py-10 text-gray-500">Загрузка...</div>

            <!-- ★ ИЗМЕНЕНИЕ: Итерируемся по единому списку `nodes` -->
            <div v-for="node in nodes" :key="node.id"
                @dblclick="node.type === 'FOLDER' ? navigateToNode(node.id) : null">
                <!-- ★ ИЗМЕНЕНИЕ: Передаем `node` и его `type` в компонент Item -->
                <DriveItem :item="node" :item-type="node.type.toLowerCase() as 'folder' | 'file'" @deleted="refresh" />
            </div>

            <div v-if="!pending && nodes.length === 0" class="col-span-full text-center py-10 text-gray-500">
                Папка пуста
            </div>
        </div>

        <!-- Модальное окно создания папки -->
        <div v-if="isCreateFolderModalOpen"
            class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
                <h3 class="text-lg font-bold mb-4">Создать новую папку</h3>
                <input v-model="newFolderName" type="text" placeholder="Имя папки"
                    class="w-full rounded border-gray-300" @keyup.enter="createFolder">
                <div class="flex justify-end gap-3 mt-4">
                    <button @click="isCreateFolderModalOpen = false"
                        class="px-4 py-2 text-sm rounded bg-gray-100">Отмена</button>
                    <button @click="createFolder"
                        class="px-4 py-2 text-sm rounded bg-blue-600 text-white">Создать</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
// ★ ИЗМЕНЕНИЕ: Импортируем новые типы и NodeType
import { NodeType, type StorageNode } from '~/types';
definePageMeta({ middleware: 'auth' });

const toast = useToast();
const route = useRoute();
const router = useRouter();

// ★ ИЗМЕНЕНИЕ: currentNodeId вместо currentFolderId
const currentNodeId = ref(parseNodeIdFromQuery(route.query.nodeId));

// ★ ИЗМЕНЕНИЕ: Логика автообновления остается, но будет работать позже, когда появятся статусы
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

// ★ ИЗМЕНЕНИЕ: useFetch теперь обращается к новому эндпоинту
const { data, pending, refresh } = await useFetch<{
    nodes: StorageNode[];
    breadcrumbs: { id: number, name: string }[];
}>(() => `/api/v1/storage/nodes/${currentNodeId.value}/children`);

// ★ ИЗМЕНЕНИЕ: Единый список узлов
const nodes = computed(() => data.value?.nodes || []);
const breadcrumbs = computed(() => data.value?.breadcrumbs || []);

// --- Навигация ---
function navigateToNode(nodeId: number | 'root') {
    currentNodeId.value = nodeId;
}
watch(currentNodeId, (newId) => {
    // ★ ИЗМЕНЕНИЕ: query параметр теперь `nodeId`
    router.push({ query: { nodeId: newId === null ? 'root' : newId } });
});

// --- Создание папки ---
const isCreateFolderModalOpen = ref(false);
const newFolderName = ref('');
async function createFolder() {
    if (!newFolderName.value.trim()) return;
    try {
        await $fetch('/api/v1/storage/nodes', {
            method: 'POST',
            body: {
                name: newFolderName.value,
                type: NodeType.FOLDER,
                parentId: currentNodeId.value,
            },
        });
        newFolderName.value = '';
        isCreateFolderModalOpen.value = false;
        await refresh();
        toast.add({ title: 'Папка успешно создана!', color: 'success' });
    } catch (e: any) {
        toast.add({ title: 'Ошибка!', description: e.data?.message, color: 'error' });
    }
}

function parseNodeIdFromQuery(queryValue: unknown): number | 'root' {
    if (!queryValue || Array.isArray(queryValue) || queryValue === 'root') {
        return 'root';
    }
    const id = parseInt(String(queryValue), 10);
    return isNaN(id) ? 'root' : id;
};

// --- Логика для загрузки (пока заглушка) ---
const isUrlDownloadModalOpen = ref(false);
</script>