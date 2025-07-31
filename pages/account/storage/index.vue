<template>
    <div>
        <h1 class="text-3xl font-bold mb-4">Личное хранилище</h1>

        <!-- Панель управления -->
        <div class="flex justify-between items-center mb-4 p-4 bg-gray-50 rounded-lg border">
            <!-- Хлебные крошки -->
            <div class="text-sm">
                <button @click="navigateToFolder('root')" class="hover:underline text-blue-600">Корень</button>
                <template v-for="crumb in breadcrumbs" :key="crumb.id">
                    <span class="mx-1 text-gray-400">/</span>
                    <button @click="navigateToFolder(crumb.id)" class="hover:underline text-blue-600">{{ crumb.name
                        }}</button>
                </template>
            </div>

            <!-- Кнопки действий -->
            <div>
                <button @click="isCreateFolderModalOpen = true"
                    class="px-3 py-1.5 text-sm bg-gray-200 rounded-md hover:bg-gray-300 mr-2">
                    + Новая папка
                </button>
                <label for="file-upload-input"
                    class="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer">
                    Загрузить файл
                </label>
                <input id="file-upload-input" type="file" multiple @change="handleFileSelect" class="hidden">
            </div>
        </div>

        <!-- Загрузчик -->
        <StorageFileUploader :files-to-upload="filesToUpload" :current-folder-id="currentFolderId"
            @upload-complete="refresh" />

        <!-- Список файлов и папок -->
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div v-if="pending" class="col-span-full text-center py-10 text-gray-500">Загрузка...</div>

            <!-- Папки -->
            <div v-for="folder in folders" :key="`folder-${folder.id}`" @dblclick="navigateToFolder(folder.id)">
                <StorageItem :item="folder" item-type="folder" @deleted="refresh" />
            </div>

            <!-- Файлы -->
            <div v-for="fileMeta in files" :key="`file-${fileMeta.id}`">
                <StorageItem :item="fileMeta" item-type="file" @deleted="refresh" />
            </div>

            <div v-if="!pending && folders.length === 0 && files.length === 0"
                class="col-span-full text-center py-10 text-gray-500">
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
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { PersonalFolder, PersonalFileMeta } from '~/types';
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const router = useRouter();

const currentFolderId = ref(parseFolderIdFromQuery(route.query.folderId));

const { data, pending, refresh } = await useFetch<{
    folders: PersonalFolder[];
    files: PersonalFileMeta[];
    breadcrumbs: { id: number, name: string }[];
}>(() => `/api/v1/storage/folder/${currentFolderId.value}`);

const folders = computed(() => data.value?.folders || []);
const files = computed(() => data.value?.files || []);
const breadcrumbs = computed(() => data.value?.breadcrumbs || []);

// --- Навигация ---
function navigateToFolder(folderId: number | 'root') {
    currentFolderId.value = folderId;
}
watch(currentFolderId, (newId) => {
    router.push({ query: { folderId: newId } });
});

// --- Создание папки ---
const isCreateFolderModalOpen = ref(false);
const newFolderName = ref('');
async function createFolder() {
    if (!newFolderName.value.trim()) return;
    await $fetch('/api/v1/storage/folder', {
        method: 'POST',
        body: { name: newFolderName.value, parentId: currentFolderId.value },
    });
    newFolderName.value = '';
    isCreateFolderModalOpen.value = false;
    refresh();
}

// --- Загрузка файлов ---
const filesToUpload = ref<File[]>([]);
function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files) {
        filesToUpload.value = Array.from(target.files);
    }
}

function parseFolderIdFromQuery(queryValue: unknown): number | 'root' {
    if (!queryValue || Array.isArray(queryValue)) {
        return 'root';
    }
    const id = parseInt(String(queryValue), 10);
    return isNaN(id) ? 'root' : id;
};
</script>