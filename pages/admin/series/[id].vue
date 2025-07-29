<template>
    <div v-if="pending">Загрузка...</div>
    <div v-else-if="error" class="text-red-500">Ошибка: Сериал не найден</div>
    <div v-else-if="series">
        <div class="flex justify-between items-center mb-6">
            <div>
                <NuxtLink to="/admin/series" class="text-sm text-blue-600 hover:underline">← К списку сериалов
                </NuxtLink>
                <h1 class="text-3xl font-bold">{{ series.title }}</h1>
            </div>
            <button @click="openCreateModal"
                class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                + Создать эпизод
            </button>
        </div>

        <div v-if="series.seasons.length === 0" class="text-gray-500 bg-white p-4 rounded-lg">
            У этого сериала еще нет эпизодов.
        </div>
        <div v-else class="space-y-4">
            <div v-for="season in series.seasons" :key="season.season_number"
                class="bg-white p-4 rounded-lg shadow-sm border">
                <h2 class="text-xl font-semibold mb-2">Сезон {{ season.season_number }}</h2>
                <table class="w-full text-sm text-left">
                    <tbody>
                        <tr v-for="episode in season.episodes" :key="episode.id" class="border-t hover:bg-gray-50">
                            <td class="p-2 w-24">Эпизод #{{ episode.episode_number }}</td>
                            <td class="p-2">{{ episode.title }}</td>
                            <td class="p-2 text-right">
                                <button @click="openEditModal(episode, season.season_number)"
                                    class="text-blue-600 hover:underline text-xs mr-4">Редактировать</button>
                                <button @click="handleDelete(episode.id)"
                                    class="text-red-600 hover:underline text-xs">Удалить</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div v-if="isModalOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white p-8 rounded-lg w-full max-w-md shadow-xl">
                <h2 class="text-xl font-bold mb-4">{{ editingEpisode ? 'Редактировать эпизод' : 'Создать новый эпизод'
                    }}</h2>
                <AdminEpisodeForm :series-id="seriesId" :initial-data="editingEpisode" @close="closeModal"
                    @submitted="onFormSubmitted" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { Series, Episode } from '~/types';
import AdminEpisodeForm from '~/components/admin/EpisodeForm.vue';

const route = useRoute();
const seriesId = parseInt(route.params.id as string, 10);

const { data: series, pending, error, refresh } = await useFetch<Series>(`/api/v1/series/${seriesId}`);

const isModalOpen = ref(false);
const editingEpisode = ref<(Episode & { season_number: number }) | null>(null);

const openCreateModal = () => {
    editingEpisode.value = null;
    isModalOpen.value = true;
};

const openEditModal = (episode: Episode, season_number: number) => {
    editingEpisode.value = { ...episode, season_number };
    isModalOpen.value = true;
};

const closeModal = () => {
    isModalOpen.value = false;
    editingEpisode.value = null;
};

const onFormSubmitted = () => {
    refresh();
    closeModal();
};

const handleDelete = async (episodeId: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот эпизод?')) return;
    try {
        await $fetch(`/api/v1/episodes/${episodeId}`, { method: 'DELETE' });
        refresh();
    } catch (e) {
        alert('Ошибка при удалении эпизода');
    }
};
</script>