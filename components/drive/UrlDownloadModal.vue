<template>
    <UModal>
        <UButton icon="i-heroicons-link-20-solid" size="sm" color="neutral" variant="solid" label="Загрузить по URL" />
        <template #header>
            <h3 class="text-base font-semibold">Загрузить файл по URL</h3>
        </template>
        <template #body>
            <div class="space-y-2">
                <p class="text-sm text-gray-500">
                    Вставьте ссылку на файл. Он будет скачан в фоновом режиме.
                </p>
                <UInput v-model="sourceUrl" placeholder="https://example.com/archive.zip" autofocus
                    @keyup.enter="handleSubmit" />
            </div>
        </template>
        <template #footer="{ close }">
            <div class="flex gap-3 justify-end">
                <UButton label="Отмена" color="neutral" variant="solid" @click="close" />
                <UButton label="Начать загрузку" color="primary" variant="solid" :loading="isLoading"
                    @click="handleSubmit(close)" />
            </div>
        </template>
    </UModal>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
    currentParentUuid: string | null;
}>();

const emit = defineEmits(['submitted']);
const toast = useToast();
const sourceUrl = ref('');
const isLoading = ref(false);

async function handleSubmit(close: () => void) {
    if (!sourceUrl.value.trim()) {
        toast.add({ title: 'URL не может быть пустым', color: 'error' });
        return;
    }
    isLoading.value = true;
    try {
        await $fetch('/api/v1/storage/nodes/create-from-url', {
            method: 'POST',
            body: {
                sourceUrl: sourceUrl.value,
                parentUuid: props.currentParentUuid,
            },
        });
        toast.add({ title: 'Загрузка поставлена в очередь!', color: 'success' });
        emit('submitted');
        sourceUrl.value = '';
        close();
    } catch (e: any) {
        toast.add({ title: 'Ошибка!', description: e.data?.message, color: 'error' });
    } finally {
        isLoading.value = false;
    }
}
</script>