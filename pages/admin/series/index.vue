<template>
    <div>
        <div class="flex justify-between items-center mb-6">
            <h1 class="text-3xl font-bold">Управление сериалами</h1>
            <button @click="openCreateModal"
                class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                + Создать сериал
            </button>
        </div>

        <div v-if="pending">Загрузка...</div>
        <div v-else-if="error" class="text-red-500">Ошибка: {{ error.message }}</div>
        <div v-else class="bg-white p-4 rounded-lg shadow-sm border">
            <!-- ... таблица без изменений ... -->
            <table class="w-full text-sm text-left">
                <thead class="border-b">
                    <tr>
                        <th class="p-2">ID</th>
                        <th class="p-2">Название</th>
                        <th class="p-2">Действия</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="s in series" :key="s.id" class="border-b hover:bg-gray-50">
                        <td class="p-2 font-mono">{{ s.id }}</td>
                        <td class="p-2">{{ s.title }}</td>
                        <td class="p-2">
                            <NuxtLink :to="`/admin/series/${s.id}`" class="text-blue-600 hover:underline">
                                Управлять
                            </NuxtLink>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Модальное окно с формой -->
        <div v-if="isModalOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white p-8 rounded-lg w-full max-w-md shadow-xl">
                <h2 class="text-xl font-bold mb-4">{{ editingSeries ? 'Редактировать сериал' : 'Создать новый сериал' }}
                </h2>
                <AdminSeriesForm :initial-data="editingSeries" @close="closeModal" @submitted="onFormSubmitted" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { Series } from '~/types';
import AdminSeriesForm from '~/components/admin/SeriesForm.vue';

// `refresh` - функция для перезагрузки данных
const { data: series, pending, error, refresh } = await useFetch<Series[]>('/api/v1/series');

const isModalOpen = ref(false);
// `editingSeries` будет хранить данные для редактирования или будет null для создания
const editingSeries = ref<Series | null>(null);

const closeModal = () => {
    isModalOpen.value = false;
    editingSeries.value = null;
};

const openCreateModal = () => {
    editingSeries.value = null;
    isModalOpen.value = true;
};

const onFormSubmitted = (result: Series) => {
    // После успешной отправки формы обновляем список и закрываем окно
    refresh();
    closeModal();
};
</script>