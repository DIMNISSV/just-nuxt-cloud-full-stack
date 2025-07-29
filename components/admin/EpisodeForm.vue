<template>
    <form @submit.prevent="handleSubmit" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
            <div>
                <label for="season_number" class="block text-sm font-medium text-gray-700">Номер сезона</label>
                <input type="number" id="season_number" v-model.number="formData.season_number" required min="0"
                    :disabled="isEditing"
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-100 disabled:cursor-not-allowed">
            </div>
            <div>
                <label for="episode_number" class="block text-sm font-medium text-gray-700">Номер эпизода</label>
                <input type="number" id="episode_number" v-model.number="formData.episode_number" required min="1"
                    :disabled="isEditing"
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-100 disabled:cursor-not-allowed">
            </div>
        </div>
        <div>
            <label for="title" class="block text-sm font-medium text-gray-700">Название эпизода</label>
            <input type="text" id="title" v-model="formData.title"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
        </div>

        <!-- Внешние ID -->
        <div class="pt-4 border-t">
            <h3 class="text-sm font-medium text-gray-900 mb-2">Внешние ID (для сезона)</h3>
            <div class="space-y-2">
                <div v-for="dbType in Object.values(ExternalDbType)" :key="dbType" class="flex items-center gap-2">
                    <label :for="`ext-id-${dbType}`" class="w-24 text-sm text-gray-500 capitalize">{{ dbType }}
                        ID</label>
                    <input type="text" :id="`ext-id-${dbType}`" v-model="formData.external_ids[dbType]"
                        class="block w-full rounded-md border-gray-300 shadow-sm sm:text-sm">
                </div>
            </div>
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
import type { Episode } from '~/types';
import { ExternalDbType } from '~/types';

const props = defineProps<{
    seriesId: number;
    initialData?: Episode & { season_number: number } | null;
}>();

const emit = defineEmits(['close', 'submitted']);

const createEmptyForm = () => ({
    season_number: 1,
    episode_number: 1,
    title: '',
    external_ids: {} as { [key in ExternalDbType]?: string }
});

const formData = reactive(createEmptyForm());
const isLoading = ref(false);
const error = ref<string | null>(null);

const isEditing = computed(() => !!props.initialData);
const buttonText = computed(() => {
    if (isLoading.value) return 'Сохранение...';
    return isEditing.value ? 'Обновить эпизод' : 'Создать эпизод';
});

watch(() => props.initialData, (newData) => {
    Object.assign(formData, createEmptyForm());
    if (newData) {
        formData.season_number = newData.season_number;
        formData.episode_number = newData.episode_number;
        formData.title = newData.title;
        formData.external_ids = { ...(newData.external_ids || {}) };
    }
}, { immediate: true, deep: true });

async function handleSubmit() {
    isLoading.value = true;
    error.value = null;
    try {
        const payload = { ...formData };
        for (const key in payload.external_ids) {
            if (!payload.external_ids[key as ExternalDbType]) {
                delete payload.external_ids[key as ExternalDbType];
            }
        }

        if (isEditing.value && props.initialData) {
            await $fetch(`/api/v1/episodes/${props.initialData.id}`, {
                method: 'PUT',
                body: { title: payload.title, external_ids: payload.external_ids }
            });
        } else {
            await $fetch(`/api/v1/series/${props.seriesId}/episodes`, {
                method: 'POST',
                body: payload
            });
        }
        emit('submitted');
    } catch (e: any) {
        error.value = e.data?.message || 'Произошла непредвиденная ошибка';
    } finally {
        isLoading.value = false;
    }
}
</script>