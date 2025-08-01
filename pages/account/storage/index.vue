// file: pages/account/storage/index.vue

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
            <div class="flex items-center gap-2">
                <button @click="isCreateFolderModalOpen = true"
                    class="px-3 py-1.5 text-sm bg-gray-200 rounded-md hover:bg-gray-300">
                    + Новая папка
                </button>

                <!-- ★ ИЗМЕНЕНИЕ: Новая кнопка для загрузки по URL -->
                <button @click="isUrlDownloadModalOpen = true"
                    class="px-3 py-1.5 text-sm bg-gray-200 rounded-md hover:bg-gray-300">
                    <Icon name="heroicons:link-20-solid" class="mr-1" />
                    Загрузить по URL
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
            <div v-if="pending && !data" class="col-span-full text-center py-10 text-gray-500">Загрузка...</div>

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

        <!-- ★ ИЗМЕНЕНИЕ: Новое модальное окно для загрузки по URL -->
        <div v-if="isUrlDownloadModalOpen"
            class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <form @submit.prevent="handleUrlDownload"
                class="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg space-y-4">
                <h3 class="text-lg font-bold">Загрузка по URL</h3>

                <div>
                    <label for="source-url" class="block text-sm font-medium text-gray-700">URL для скачивания</label>
                    <input v-model="urlDownloadForm.sourceUrl" type="url" id="source-url" required
                        placeholder="https://example.com/file.mkv"
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700">Тип файла</label>
                    <div class="mt-2 space-y-2">
                        <div class="flex items-center">
                            <input v-model="urlDownloadForm.assetType" :value="AssetType.PERSONAL" type="radio"
                                id="type-personal" name="assetType" class="h-4 w-4 border-gray-300 text-blue-600">
                            <label for="type-personal" class="ml-3 block text-sm text-gray-900">Личный файл (сохранить в
                                текущую
                                папку)</label>
                        </div>
                        <div class="flex items-center">
                            <input v-model="urlDownloadForm.assetType" :value="AssetType.MEDIA_SOURCE" type="radio"
                                id="type-media" name="assetType" class="h-4 w-4 border-gray-300 text-blue-600">
                            <label for="type-media" class="ml-3 block text-sm text-gray-900">Медиа-ресурс (для
                                дальнейшей
                                обработки и привязки к эпизоду)</label>
                        </div>
                    </div>
                </div>

                <div class="flex justify-end gap-3 pt-4 border-t">
                    <button @click="isUrlDownloadModalOpen = false" type="button"
                        class="px-4 py-2 text-sm rounded bg-gray-100 hover:bg-gray-200">Отмена</button>
                    <button type="submit" :disabled="isUrlDownloadLoading"
                        class="px-4 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
                        {{ isUrlDownloadLoading ? 'В очереди...' : 'Начать загрузку' }}
                    </button>
                </div>
            </form>
        </div>

    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { AssetType } from '~/types';
import type { PersonalFolder, PersonalFileMeta } from '~/types';
definePageMeta({ middleware: 'auth' });

const toast = useToast();
const route = useRoute();
const router = useRouter();

const currentFolderId = ref(parseFolderIdFromQuery(route.query.folderId));

let refreshInterval: ReturnType<typeof setInterval> | null = null;
onMounted(() => {
    refreshInterval = setInterval(() => {
        const hasProcessingFiles = files.value.some(f => f.asset?.status === 'PROCESSING' || f.asset?.status === 'PENDING');
        if (hasProcessingFiles) {
            refresh();
        }
    }, 5000);
});
onUnmounted(() => {
    if (refreshInterval) clearInterval(refreshInterval);
});


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
        body: {
            name: newFolderName.value,
            parentId: currentFolderId.value === 'root' ? null : currentFolderId.value
        },
    });
    newFolderName.value = '';
    isCreateFolderModalOpen.value = false;
    await refresh();
    toast.add({ title: 'Папка успешно создана!', color: 'success' });
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
    if (!queryValue || Array.isArray(queryValue)) return 'root';
    const id = parseInt(String(queryValue), 10);
    return isNaN(id) ? 'root' : id;
};

// --- Логика для загрузки по URL ---
const isUrlDownloadModalOpen = ref(false);
const isUrlDownloadLoading = ref(false);
const urlDownloadForm = reactive({
    sourceUrl: '',
    assetType: AssetType.PERSONAL
});

async function handleUrlDownload() {
    if (!urlDownloadForm.sourceUrl.trim()) {
        // ★ ИЗМЕНЕНИЕ: color: 'red' -> color: 'error'
        toast.add({ title: 'Ошибка', description: 'Пожалуйста, введите URL', color: 'error' });
        return;
    }

    isUrlDownloadLoading.value = true;
    try {
        const payload = {
            ...urlDownloadForm,
            folderId: urlDownloadForm.assetType === AssetType.PERSONAL
                ? (currentFolderId.value === 'root' ? null : currentFolderId.value)
                : undefined,
        };

        await $fetch('/api/v1/assets/download-from-url', {
            method: 'POST',
            body: payload,
        });

        toast.add({
            title: 'Загрузка поставлена в очередь',
            description: 'Файл скоро появится в списке. Статус будет обновляться автоматически.',
            icon: 'i-heroicons-clock',
            color: 'primary'
        });

        isUrlDownloadModalOpen.value = false;
        urlDownloadForm.sourceUrl = '';
        urlDownloadForm.assetType = AssetType.PERSONAL;

        await refresh();

    } catch (e: any) {
        // ★ ИЗМЕНЕНИЕ: color: 'red' -> color: 'error'
        toast.add({ title: 'Ошибка!', description: e.data?.message || 'Не удалось поставить загрузку в очередь', color: 'error' });
    } finally {
        isUrlDownloadLoading.value = false;
    }
}
</script>