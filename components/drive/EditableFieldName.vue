<template>
  <div>
    <!-- Режим отображения -->
    <div v-if="!isEditing" @click="startEditing"
      class="p-2 -m-2 rounded-md hover:bg-gray-200 cursor-pointer transition">
      <h3 class="text-lg font-semibold text-gray-900 break-words">{{ modelValue }}</h3>
    </div>
    <!-- Режим редактирования -->
    <div v-else>
      <UInput ref="inputRef" v-model="editableName" @blur="cancelEditing" @keyup.enter="save" :loading="isLoading" />
      <p class="text-xs text-gray-500 mt-1">Нажмите Enter для сохранения или кликните в стороне для отмены.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue';

const props = defineProps<{
  modelValue: string; // Текущее имя файла/папки
  nodeId: number;     // ID узла для отправки запроса
}>();

const emit = defineEmits(['update:modelValue', 'renamed']);

const toast = useToast();
const isEditing = ref(false);
const isLoading = ref(false);
const editableName = ref(props.modelValue);

// ★ ИСПРАВЛЕНИЕ: Мы типизируем ref, описывая только нужную нам структуру,
// а не пытаясь угадать сложный внутренний тип компонента UInput.
const inputRef = ref<{ input: HTMLInputElement } | null>(null);

const startEditing = async () => {
  editableName.value = props.modelValue;
  isEditing.value = true;
  await nextTick();
  // Теперь TypeScript знает, что у inputRef.value есть свойство `input`
  inputRef.value?.input.focus();
};

const cancelEditing = () => {
  isEditing.value = false;
};

const save = async () => {
  if (isLoading.value) return;
  if (editableName.value.trim() === '' || editableName.value === props.modelValue) {
    isEditing.value = false;
    return;
  }

  isLoading.value = true;
  try {
    await $fetch(`/api/v1/storage/nodes/${props.nodeId}`, {
      method: 'PUT',
      body: { name: editableName.value },
    });
    toast.add({ title: 'Успешно переименовано!', color: 'success' });
    emit('update:modelValue', editableName.value);
    emit('renamed');
    isEditing.value = false;
  } catch (e: any) {
    toast.add({ title: 'Ошибка!', description: e.data?.message, color: 'error' });
  } finally {
    isLoading.value = false;
  }
};
</script>