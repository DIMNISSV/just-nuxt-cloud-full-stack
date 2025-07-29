<template>
    <div class="p-4 border rounded-lg bg-white shadow-sm space-y-4">
        <h2 class="text-xl font-semibold">1. Выбор целевого эпизода</h2>

        <!-- Шаг 1: Поиск и выбор сериала -->
        <div class="space-y-1">
            <label for="series-search" class="block text-sm font-medium text-gray-700">Поиск сериала</label>
            <div class="relative">
                <input id="series-search" type="text" v-model="searchQuery" placeholder="Начните вводить название..."
                    class="w-full rounded-md border-gray-300 shadow-sm">
                <!-- Результаты поиска -->
                <div v-if="searchQuery"
                    class="absolute z-10 w-full bg-white border mt-1 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    <ul>
                        <li v-if="searchResults.length > 0" v-for="series in searchResults" :key="series.id"
                            @click="selectSeries(series.id)" class="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm">
                            {{ series.title }}
                        </li>
                        <li v-if="!isSearching" @click="openCreateSeriesModal"
                            class="px-3 py-2 hover:bg-gray-100 hover:underline cursor-pointer text-sm text-blue-600">
                            Создать сериал "{{ searchQuery }}"...
                        </li>
                    </ul>
                </div>
                <div v-if="isSearching" class="absolute right-3 top-2 text-gray-400">...</div>
            </div>
        </div>

        <!-- Шаг 2: Выбор сезона и эпизода (появляется после выбора сериала) -->
        <div v-if="selectedSeriesData" class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <div class="p-2 border rounded-md bg-gray-50 flex gap-4 items-center">
                <img :src="selectedSeriesData.poster_url" class="h-16 w-auto rounded" alt="poster">
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
                        <option v-for="season in selectedSeriesData.seasons" :key="season.season_number"
                            :value="season.season_number">
                            Сезон {{ season.season_number }}
                        </option>
                    </select>
                </div>
                <div>
                    <label for="episode-select" class="block text-sm font-medium text-gray-700">Эпизод</label>
                    <select id="episode-select" v-model="selectedEpisodeId"
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm" :disabled="!selectedSeason">
                        <option v-for="episode in selectedSeason?.episodes" :key="episode.id" :value="episode.id">
                            Эпизод {{ episode.episode_number }}: {{ episode.title }}
                        </option>
                    </select>
                    <button @click="openCreateEpisodeModal" class="text-xs text-blue-600 hover:underline">Создать
                        эпизод</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Модальное окно для создания Сериала -->
    <div v-if="isCreateSeriesModalOpen"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white p-8 rounded-lg w-full max-w-md shadow-xl">
            <h2 class="text-xl font-bold mb-4">Создать новый сериал</h2>
            <AdminSeriesForm :initial-data="null" @close="isCreateSeriesModalOpen = false"
                @submitted="onSeriesCreated" />
        </div>
    </div>

    <!-- Модальное окно для создания Эпизода -->
    <div v-if="isCreateEpisodeModalOpen && selectedSeriesData"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white p-8 rounded-lg w-full max-w-md shadow-xl">
            <h2 class="text-xl font-bold mb-4">Создать новый эпизод</h2>
            <AdminEpisodeForm :series-id="selectedSeriesData.id" :initial-data="null"
                @close="isCreateEpisodeModalOpen = false" @submitted="onEpisodeCreated" />
        </div>
    </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { useDebounceFn } from '@vueuse/core';
import AdminSeriesForm from '~/components/admin/SeriesForm.vue';
import AdminEpisodeForm from '~/components/admin/EpisodeForm.vue';

// Определяем события, которые компонент будет отправлять родителю
const emit = defineEmits(['episodeSelected']);

const searchQuery = ref('');
const searchResults = ref([]);
const isSearching = ref(false);
const selectedSeriesData = ref(null);
const selectedSeasonNumber = ref(null);
const selectedEpisodeId = ref(null);
const isCreateSeriesModalOpen = ref(false);
const isCreateEpisodeModalOpen = ref(false);

const openCreateSeriesModal = () => {
    isCreateSeriesModalOpen.value = true;
};
const openCreateEpisodeModal = () => {
    if (!selectedSeriesData.value) return; // Защита
    isCreateEpisodeModalOpen.value = true;
};

const onSeriesCreated = (newSeries) => {
    isCreateSeriesModalOpen.value = false;
    // Сразу выбираем только что созданный сериал
    selectSeries(newSeries.id);
};

const onEpisodeCreated = async () => {
    isCreateEpisodeModalOpen.value = false;
    if (selectedSeriesData.value) {
        const seriesIdToUpdate = selectedSeriesData.value.id;
        // 1. Обновляем данные сериала, чтобы получить список с новым эпизодом
        await selectSeries(seriesIdToUpdate);

        // 2. Находим только что созданный эпизод
        // (простой способ - найти эпизод с самым большим номером)
        if (selectedSeriesData.value?.seasons.length > 0) {
            const allEpisodes = selectedSeriesData.value.seasons.flatMap(s => s.episodes);
            if (allEpisodes.length > 0) {
                const latestEpisode = allEpisodes.reduce((latest, current) =>
                    (latest.episode_number > current.episode_number) ? latest : current
                );
                // 3. Программно выбираем его
                selectedEpisodeId.value = latestEpisode.id;
            }
        }
    }
};

// Функция поиска с дебаунсом, чтобы не отправлять запросы на каждое нажатие клавиши
const searchForSeries = useDebounceFn(async () => {
    if (searchQuery.value.length < 2) {
        searchResults.value = [];
        return;
    }
    isSearching.value = true;
    try {
        const results = await $fetch(`/api/v1/series?q=${searchQuery.value}`);
        searchResults.value = results;
    } catch (e) {
        console.error("Ошибка поиска сериала:", e);
        searchResults.value = [];
    } finally {
        isSearching.value = false;
    }
}, 300);

watch(searchQuery, searchForSeries);

const selectSeries = async (seriesId) => {
    searchQuery.value = '';
    searchResults.value = [];
    try {
        const seriesData = await $fetch(`/api/v1/series/${seriesId}`);
        selectedSeriesData.value = seriesData;
        // Автоматически выбираем первый сезон и первый эпизод
        if (seriesData.seasons.length > 0) {
            selectedSeasonNumber.value = seriesData.seasons[0].season_number;
            if (seriesData.seasons[0].episodes.length > 0) {
                selectedEpisodeId.value = seriesData.seasons[0].episodes[0].id;
            }
        }
    } catch (e) {
        console.error("Ошибка загрузки данных сериала:", e);
    }
};

const resetSelection = () => {
    selectedSeriesData.value = null;
    selectedSeasonNumber.value = null;
    selectedEpisodeId.value = null;
    emit('episodeSelected', null); // Сообщаем родителю, что выбор сброшен
};

const selectedSeason = computed(() => {
    if (!selectedSeriesData.value || !selectedSeasonNumber.value) return null;
    return selectedSeriesData.value.seasons.find(s => s.season_number === selectedSeasonNumber.value);
});

// Когда меняется выбранный эпизод, сообщаем родителю
watch(selectedEpisodeId, (newId) => {
    if (newId) {
        const episode = selectedSeason.value?.episodes.find(e => e.id === newId);
        const series = selectedSeriesData.value;
        emit('episodeSelected', {
            seriesId: series.id,
            seasonNumber: selectedSeasonNumber.value,
            episodeId: episode.id,
            episodeNumber: episode.episode_number,
        });
    }
});
</script>