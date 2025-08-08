<template>
    <div v-if="pending">Загрузка...</div>
    <div v-else-if="error" class="text-red-500">Ошибка: Сериал не найден</div>
    <div v-else-if="series">
        <div class="flex justify-between items-center mb-6">
            <div>
                <!-- Кнопка назад к списку сериалов -->
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
            <!-- Отображаем каждый сезон в отдельном блоке -->
            <div v-for="season in series.seasons" :key="season.seasonNumber"
                class="bg-white p-4 rounded-lg shadow-sm border">
                <h2 class="text-xl font-semibold mb-2">Сезон {{ season.seasonNumber }}</h2>
                <table class="w-full text-sm text-left">
                    <tbody>
                        <!-- Перечисляем эпизоды внутри сезона -->
                        <tr v-for="episode in season.episodes" :key="episode.id" class="border-t hover:bg-gray-50">
                            <td class="p-2 w-24">Эпизод #{{ episode.episodeNumber }}</td>
                            <td class="p-2">{{ episode.title }}</td>
                            <td class="p-2 text-right">
                                <!-- Кнопка "Редактировать" -->
                                <button @click="openEditModal(episode, season.seasonNumber)"
                                    class="text-blue-600 hover:underline text-xs mr-4">Редактировать</button>
                                <!-- Кнопка "Удалить" -->
                                <button @click="handleDelete(episode.id)"
                                    class="text-red-600 hover:underline text-xs">Удалить</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Модальное окно с формой создания/редактирования эпизода -->
        <div v-if="isModalOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white p-8 rounded-lg w-full max-w-md shadow-xl">
                <h2 class="text-xl font-bold mb-4">{{ editingEpisode ? 'Редактировать эпизод' : 'Создать новый эпизод'
                }}</h2>
                <!-- Передаем seriesId и initialData в форму -->
                <AdminEpisodeForm :series-id="seriesId" :initial-data="editingEpisode" @close="closeModal"
                    @submitted="onFormSubmitted" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { Series, Episode } from '~/types'; // Импортируем необходимые типы
import AdminEpisodeForm from '~/components/admin/EpisodeForm.vue'; // Импортируем новую форму

const route = useRoute();
const seriesId = parseInt(route.params.id as string, 10); // Получаем ID сериала из URL

// Загружаем данные о сериале, включая сезоны и эпизоды
const { data: series, pending, error, refresh } = await useFetch<Series>(`/api/v1/series/${seriesId}`);

const isModalOpen = ref(false);
// `editingEpisode` будет хранить данные для редактирования или будет null для создания
const editingEpisode = ref<(Episode & { seasonNumber: number }) | null>(null);

const openCreateModal = () => {
    editingEpisode.value = null; // Для создания нового эпизода
    isModalOpen.value = true;
};

// Функция для открытия модального окна в режиме редактирования
const openEditModal = (episode: Episode, seasonNumber: number) => {
    // Создаем копию эпизода и добавляем seasonNumber для формы
    editingEpisode.value = { ...episode, seasonNumber };
    isModalOpen.value = true;
};

const closeModal = () => {
    isModalOpen.value = false;
    editingEpisode.value = null; // Сбрасываем данные для редактирования
};

const onFormSubmitted = () => {
    refresh(); // Обновляем данные на странице после отправки формы
    closeModal();
};

const handleDelete = async (episodeId: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот эпизод?')) return;
    try {
        await $fetch(`/api/v1/admin/episodes/${episodeId}`, { method: 'DELETE' });
        refresh(); // Обновляем список эпизодов после удаления
    } catch (e: any) {
        alert(e.data?.message || 'Ошибка при удалении эпизода');
    }
};
</script>