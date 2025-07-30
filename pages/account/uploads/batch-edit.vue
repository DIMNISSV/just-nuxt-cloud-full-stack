<template>
    <div>
        <h1 class="text-3xl font-bold mb-6">Пакетная настройка</h1>
        <div v-if="uploadsToConfigure.length === 0" class="text-red-500">
            Не выбрано ни одной подходящей для настройки загрузки.
            <NuxtLink to="/account/uploads" class="text-blue-600 hover:underline">Вернуться к списку</NuxtLink>
        </div>
        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Левая колонка: выбор эпизода -->
            <div>
                <EpisodeSelector @episodeSelected="handleEpisodeSelection" />
            </div>
            <!-- Правая колонка: список загрузок и результат -->
            <div class="space-y-4">
                <div class="p-4 border rounded-lg bg-white">
                    <h2 class="font-semibold mb-2">Загрузки для настройки ({{ uploadsToConfigure.length }} шт.)</h2>
                    <draggable v-model="uploadsToConfigure" item-key="id" tag="ul"
                        class="text-sm space-y-1 max-h-60 overflow-y-auto" handle=".handle">
                        <template #item="{ element, index }">
                            <li class="p-2 bg-gray-50 rounded flex items-center justify-between group">
                                <div class="flex items-center gap-2">
                                    <!-- Иконка для перетаскивания (handle) -->
                                    <span class="handle cursor-grab text-gray-400 group-hover:text-gray-600">☰</span>
                                    <span class="font-bold">#{{ index + 1 }}</span>: {{ element.originalFilename }}
                                </div>
                                <!-- Кнопка удаления элемента из списка -->
                                <button @click="uploadsToConfigure.splice(index, 1)"
                                    class="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100"
                                    title="Убрать из списка">
                                    ×
                                </button>
                            </li>
                        </template>
                    </draggable>
                </div>
                <div v-if="selectedEpisodeInfo" class="p-4 border rounded-lg bg-white">
                    <h2 class="font-semibold mb-2">План привязки</h2>
                    <p class="text-sm">
                        Первая загрузка будет привязана к <strong>Сезон {{ selectedEpisodeInfo.seasonNumber }}, Эпизод
                            {{ selectedEpisodeInfo.episodeNumber }}</strong>,
                        а последующие — к следующим по номеру эпизодам.
                    </p>
                    <div class="mt-4 pt-4 border-t">
                        <label class="flex items-center gap-2 text-sm cursor-pointer">
                            <input type="checkbox" v-model="shouldAutoCreateEpisodes" class="rounded">
                            <span>Автоматически создавать недостающие эпизоды</span>
                        </label>
                    </div>
                </div>

                <button @click="handleSubmit" :disabled="!selectedEpisodeInfo || isLoading"
                    class="w-full py-2 px-4 bg-indigo-600 text-white rounded-md disabled:opacity-50">
                    {{ isLoading ? 'Выполнение...' : 'Применить и настроить' }}
                </button>

                <div v-if="resultMessage" class="p-3 rounded-md text-sm"
                    :class="isError ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'">
                    {{ resultMessage }}
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { Upload, EpisodeSelection } from '~/types';
import EpisodeSelector from '~/components/EpisodeSelector.vue';
import draggable from 'vuedraggable';

definePageMeta({ middleware: 'auth' });

const route = useRoute();
const { data: allUploads } = await useFetch<Upload[]>('/api/v1/account/uploads');
const uploadsToConfigure = ref<Upload[]>([]);
onMounted(() => {
    const idsQuery = (route.query.ids as string || '').split(',').map(String).filter(Boolean);
    const filteredUploads = allUploads.value?.filter(u => idsQuery.includes(u.uuid) && !u.linkedEpisodeId) || [];
    uploadsToConfigure.value = filteredUploads;
});

const idsQuery = (route.query.ids as string || '').split(',').map(String).filter(Boolean);

const selectedEpisodeInfo = ref<EpisodeSelection | null>(null);
const shouldAutoCreateEpisodes = ref(true);
const isLoading = ref(false);
const resultMessage = ref<string | null>(null);
const isError = ref(false);

const handleEpisodeSelection = (selection: EpisodeSelection | null) => {
    selectedEpisodeInfo.value = selection;
};

const handleSubmit = async () => {
    if (!selectedEpisodeInfo.value) return;
    isLoading.value = true;
    resultMessage.value = null;
    isError.value = false;

    try {
        const response = await $fetch<{ message: string }>('/api/v1/account/uploads/batch-configure', {
            method: 'POST',
            body: {
                uploadIds: uploadsToConfigure.value.map(u => u.id),
                startEpisodeId: selectedEpisodeInfo.value.episodeId,
                autoCreateEpisodes: shouldAutoCreateEpisodes.value,
            }
        });
        resultMessage.value = response.message;
        setTimeout(() => navigateTo('/account/uploads'), 3000);
    } catch (e: any) {
        resultMessage.value = e.data?.message || 'Произошла ошибка при пакетной настройке.';
        isError.value = true;
    } finally {
        isLoading.value = false;
    }
};
</script>