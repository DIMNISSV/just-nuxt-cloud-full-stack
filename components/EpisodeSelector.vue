<template>
    <div class="p-4 border rounded-lg bg-white shadow-sm space-y-4">
        <h2 class="text-xl font-semibold">1. Выбор целевого эпизода</h2>

        <!-- Шаг 1: Поиск и выбор сериала -->
        <div class="space-y-1">
            <label for="series-search" class="block text-sm font-medium text-gray-700">Поиск сериала</label>
            <div class="relative">
                <input id="series-search" type="text" v-model="searchQuery" placeholder="Начните вводить название..."
                    class="w-full rounded-md border-gray-300 shadow-sm">

                <div v-if="searchQuery"
                    class="absolute z-10 w-full bg-white border mt-1 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    <ul>
                        <li v-for="series in searchResults" :key="series.id" @mousedown="selectSeries(series.id)"
                            class="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm">
                            {{ series.title }}
                        </li>
                        <li v-if="!isSearching" @mousedown="openCreateSeriesModal"
                            class="px-3 py-2 hover:bg-gray-100 hover:underline cursor-pointer text-sm text-blue-600">
                            Создать сериал "{{ searchQuery }}"...
                        </li>
                    </ul>
                </div>

                <div v-if="isSearching" class="absolute right-3 top-2 text-gray-400">...</div>
            </div>
        </div>

        <!-- Шаг 2: Выбор сезона и эпизода -->
        <div v-if="selectedSeriesData" class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <div class="p-2 border rounded-md bg-gray-50 flex gap-4 items-center">
                <img :src="selectedSeriesData.posterUrl ?? undefined" class="h-16 w-auto rounded" alt="poster">
                <div>
                    <h3 class="font-bold">{{ selectedSeriesData.title }}</h3>
                    <button @click="resetSelection" class="text-xs text-blue-600 hover:underline">Изменить
                        сериал</button>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label for="season-select" class="block text-sm font-medium text-gray-700">Сезон</label>
                    <select id="season-select" v-model="selectedSeasonNumber"
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                        <option
                            v-if="!selectedSeriesData || !selectedSeriesData.seasons || selectedSeriesData.seasons.length === 0"
                            value="" disabled>
                            -- Сезонов нет --
                        </option>
                        <option v-for="season in selectedSeriesData.seasons" :key="season.id"
                            :value="season.seasonNumber">
                            Сезон {{ season.seasonNumber }}
                        </option>
                    </select>
                </div>
                <div>
                    <label for="episode-select" class="block text-sm font-medium text-gray-700">Эпизод</label>
                    <select id="episode-select" v-model="selectedEpisodeId"
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm" :disabled="!selectedSeason">
                        <option value="" disabled>-- Выберите эпизод --</option>
                        <option v-for="episode in selectedSeason?.episodes" :key="episode.id" :value="episode.id">
                            Эпизод {{ episode.episodeNumber }}: {{ episode.title }}
                        </option>
                    </select>
                    <button @click="openCreateEpisodeModal" class="text-xs text-blue-600 hover:underline mt-1">
                        + Создать новый эпизод
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Модальные окна -->
    <div v-if="isCreateSeriesModalOpen"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white p-8 rounded-lg w-full max-w-md shadow-xl">
            <h2 class="text-xl font-bold mb-4">Создать новый сериал</h2>
            <AdminSeriesForm :initial-data="null" @close="isCreateSeriesModalOpen = false"
                @submitted="onSeriesCreated" />
        </div>
    </div>

    <div v-if="isCreateEpisodeModalOpen && selectedSeriesData"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white p-8 rounded-lg w-full max-w-md shadow-xl">
            <h2 class="text-xl font-bold mb-4">Создать новый эпизод</h2>
            <AdminEpisodeForm :series-id="selectedSeriesData.id" :initial-data="null"
                @close="isCreateEpisodeModalOpen = false" @submitted="onEpisodeCreated" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useDebounceFn } from '@vueuse/core';
import type { Series, Episode, Season, EpisodeSelection } from '~/types'; // Убедитесь, что типы импортированы
import AdminSeriesForm from '~/components/admin/SeriesForm.vue';
import AdminEpisodeForm from '~/components/admin/EpisodeForm.vue';

const emit = defineEmits(['episodeSelected']);

const searchQuery = ref('');
const searchResults = ref<Pick<Series, 'id' | 'title'>[]>([]);
const isSearching = ref(false);
const selectedSeriesData = ref<Series & { seasons: (Season & { episodes: Episode[] })[] } | null>(null);
const selectedSeasonNumber = ref<string | number>('');
const selectedEpisodeId = ref<string | number>('');

// Модальные окна
const isCreateSeriesModalOpen = ref(false);
const isCreateEpisodeModalOpen = ref(false);

const openCreateSeriesModal = () => isCreateSeriesModalOpen.value = true;
const openCreateEpisodeModal = () => { if (selectedSeriesData.value) isCreateEpisodeModalOpen.value = true; };

const onSeriesCreated = (newSeries: Series) => {
    isCreateSeriesModalOpen.value = false;
    selectSeries(newSeries.id);
};

const onEpisodeCreated = async () => {
    isCreateEpisodeModalOpen.value = false;
    if (selectedSeriesData.value) {
        await selectSeries(selectedSeriesData.value.id, true);
    }
};

const searchForSeries = useDebounceFn(async () => {
    if (searchQuery.value.length < 2) {
        searchResults.value = [];
        return;
    }
    isSearching.value = true;
    try {
        searchResults.value = await $fetch(`/api/v1/series?q=${searchQuery.value}`);
    } catch (e) {
        console.error("Ошибка поиска сериала:", e);
        searchResults.value = [];
    } finally {
        isSearching.value = false;
    }
}, 300);
watch(searchQuery, searchForSeries);

const selectSeries = async (seriesId: number, isUpdate = false) => {
    searchQuery.value = '';
    searchResults.value = [];

    if (!isUpdate) {
        selectedSeriesData.value = null;
        emit('episodeSelected', null);
    }

    try {
        selectedSeriesData.value = await $fetch(`/api/v1/series/${seriesId}`);
        const seriesData = selectedSeriesData.value;

        if (seriesData?.seasons && seriesData.seasons.length > 0) {
            const firstSeason = seriesData.seasons[0];
            selectedSeasonNumber.value = firstSeason.seasonNumber;

            if (firstSeason.episodes && firstSeason.episodes.length > 0) {
                selectedEpisodeId.value = firstSeason.episodes[0].id;
            } else {
                selectedEpisodeId.value = '';
            }
        } else {
            selectedSeasonNumber.value = '';
            selectedEpisodeId.value = '';
        }
    } catch (e) {
        console.error("Ошибка загрузки данных сериала:", e);
        selectedSeriesData.value = null;
        selectedSeasonNumber.value = '';
        selectedEpisodeId.value = '';
    }
};

const resetSelection = () => {
    selectedSeriesData.value = null;
    selectedSeasonNumber.value = '';
    selectedEpisodeId.value = '';
    emit('episodeSelected', null);
};

const selectedSeason = computed(() => {
    if (!selectedSeriesData.value || !selectedSeasonNumber.value) return null;
    return selectedSeriesData.value.seasons.find(s => s.seasonNumber == selectedSeasonNumber.value);
});

watch(selectedSeasonNumber, (newVal) => {
    if (!newVal) return;
    const newSeason = selectedSeriesData.value?.seasons.find(s => s.seasonNumber == newVal);
    if (newSeason?.episodes && newSeason.episodes.length > 0) {
        selectedEpisodeId.value = newSeason.episodes[0].id;
    } else {
        selectedEpisodeId.value = '';
    }
});

watch(selectedEpisodeId, (newId) => {
    if (newId && selectedSeason.value) {
        const episode = selectedSeason.value.episodes.find(e => e.id == newId);
        if (episode) {
            emit('episodeSelected', {
                seriesId: selectedSeriesData.value!.id,
                seasonNumber: selectedSeason.value.seasonNumber,
                episodeId: episode.id,
                episodeNumber: episode.episodeNumber,
            } as EpisodeSelection);
        }
    } else {
        emit('episodeSelected', null);
    }
});
</script>