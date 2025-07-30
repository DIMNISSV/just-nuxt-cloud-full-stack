<template>
    <div>
        <div class="flex justify-between items-center mb-6">
            <h1 class="text-3xl font-bold">Управление переводчиками</h1>
            <button @click="openModal(null)"
                class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                + Добавить
            </button>
        </div>

        <div v-if="pending">Загрузка...</div>
        <div v-else class="bg-white p-4 rounded-lg shadow-sm border">
            <ul>
                <li v-for="translator in translators" :key="translator.id"
                    class="flex justify-between items-center p-2 border-b last:border-b-0 hover:bg-gray-50">
                    <span>{{ translator.name }}</span>
                    <div class="flex gap-4">
                        <button @click="openModal(translator)"
                            class="text-blue-600 hover:underline text-sm">Редактировать</button>
                        <button @click="handleDelete(translator.id)"
                            class="text-red-600 hover:underline text-sm">Удалить</button>
                    </div>
                </li>
            </ul>
        </div>

        <!-- Модальное окно -->
        <div v-if="isModalOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white p-8 rounded-lg w-full max-w-md shadow-xl">
                <h2 class="text-xl font-bold mb-4">{{ editingTranslator ? 'Редактировать' : 'Новый переводчик' }}</h2>
                <form @submit.prevent="handleSubmit">
                    <input v-model="form.name" type="text" required class="w-full rounded-md border-gray-300"
                        placeholder="Название студии">
                    <div class="flex justify-end gap-4 pt-4 mt-4 border-t">
                        <button type="button" @click="closeModal"
                            class="px-4 py-2 text-sm bg-gray-100 rounded-md">Отмена</button>
                        <button type="submit"
                            class="px-4 py-2 text-sm text-white bg-blue-600 rounded-md">Сохранить</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { Translator } from '~/types';

const { data: translators, pending, error, refresh } = await useFetch<Translator[]>('/api/v1/translators');

const isModalOpen = ref(false);
const editingTranslator = ref<Translator | null>(null);
const form = reactive({ name: '' });

const openModal = (translator: Translator | null) => {
    editingTranslator.value = translator;
    form.name = translator?.name || '';
    isModalOpen.value = true;
};

const closeModal = () => { isModalOpen.value = false; };

const handleSubmit = async () => {
    try {
        if (editingTranslator.value) {
            await $fetch(`/api/v1/admin/translators/${editingTranslator.value.id}`, {
                method: 'PUT',
                body: form 
            });
        } else {
            await $fetch('/api/v1/admin/translators', { method: 'POST', body: form });
        }
        refresh();
        closeModal();
    } catch (e) { alert('Ошибка сохранения'); }
};

const handleDelete = async (id: number) => {
    if (!confirm('Вы уверены?')) return;
    try {
        await $fetch(`/api/v1/admin/translators/${id}`, { method: 'DELETE' });
        refresh();
    } catch (e) { alert('Ошибка удаления'); }
};
</script>