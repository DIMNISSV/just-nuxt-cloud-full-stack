<template>
    <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
            <label for="title" class="block text-sm font-medium text-gray-700">Название сериала</label>
            <input type="text" id="title" v-model="formData.title"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
        </div>
        <div>
            <label for="posterUrl" class="block text-sm font-medium text-gray-700">URL постера</label>
            <input type="url" id="posterUrl" v-model="formData.posterUrl"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
        </div>

        <div v-if="error" class="p-3 bg-red-100 text-red-700 rounded-md text-sm">
            {{ error }}
        </div>

        <div class="flex justify-end gap-4 pt-4">
            <button type="button" @click="emit('close')"
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                Отмена
            </button>
            <button type="submit" :disabled="isLoading"
                class="px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm disabled:opacity-50"
                :class="isEditing ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'">
                {{ buttonText }}
            </button>
        </div>
    </form>
</template>

<script setup lang="ts">
import { reactive, ref, computed, watch } from 'vue';
import type { Series } from '~/types';

const props = defineProps<{
    initialData?: Series | null;
}>();

const emit = defineEmits(['close', 'submitted']);

const formData = reactive({
    title: '',
    posterUrl: '',
});

const isLoading = ref(false);
const error = ref<string | null>(null);

const isEditing = computed(() => !!props.initialData);
const buttonText = computed(() => {
    if (isLoading.value) return 'Сохранение...';
    return isEditing.value ? 'Обновить сериал' : 'Создать сериал';
});

watch(() => props.initialData, (newData) => {
    if (newData) {
        formData.title = newData.title;
        // ★ ИСПРАВЛЕНИЕ: Преобразуем null в пустую строку, чтобы избежать ошибки типа.
        formData.posterUrl = newData.posterUrl || '';
    } else {
        formData.title = '';
        formData.posterUrl = '';
    }
}, { immediate: true });

async function handleSubmit() {
    isLoading.value = true;
    error.value = null;

    try {
        let result: Series;
        if (isEditing.value && props.initialData) {
            result = await $fetch(`/api/v1/admin/series/${props.initialData.id}`, {
                method: 'PUT',
                body: formData
            });
        } else {
            result = await $fetch('/api/v1/admin/series', {
                method: 'POST',
                body: formData
            });
        }
        emit('submitted', result);
    } catch (e: any) {
        error.value = e.data?.message || 'Произошла непредвиденная ошибка';
    } finally {
        isLoading.value = false;
    }
}
</script>