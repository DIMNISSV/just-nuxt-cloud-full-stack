<template>
  <div v-if="pending" class="text-gray-500 text-center py-10">Загрузка основной информации...</div>
  <div v-else-if="error" class="p-4 bg-red-100 text-red-800 rounded-lg">
    <h1 class="text-2xl font-bold mb-2">Ошибка</h1>
    <p>{{ error.data?.message || error.message }}</p>
  </div>
  <div v-else-if="uploadData" class="space-y-6">
    <h1 class="text-3xl font-bold">Настройка загрузки</h1>
    <p class="text-sm text-gray-600">
      Файл: <span class="font-mono bg-gray-100 p-1 rounded">{{ uploadData.upload.originalFilename }}</span>
    </p>

    <!-- === ЭТАП 1: ИДЕНТИФИКАЦИЯ (если еще не привязано) === -->
    <template v-if="!uploadData.upload.linkedEpisodeId">
      <div class="border-t pt-6">
        <p class="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded-md text-sm">
          <strong>Шаг 1 из 2:</strong> Эта загрузка еще не привязана ни к одному эпизоду. Пожалуйста, выберите целевой
          эпизод. Это действие нельзя будет отменить.
        </p>
        <EpisodeSelector @episodeSelected="handleEpisodeSelection" />
        <div class="mt-4">
          <button @click="linkEpisode" :disabled="!selectedEpisodeInfo || isLinking"
            class="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">
            {{ isLinking ? 'Привязка...' : 'Привязать к этому эпизоду' }}
          </button>
        </div>
      </div>
    </template>

    <!-- === ЭТАП 2: УПРАВЛЕНИЕ СБОРКАМИ (если уже привязано) === -->
    <template v-else>
      <div class="border-t pt-6 space-y-6">
        <!-- Блок 2.1: Существующие сборки -->
        <div class="p-4 border rounded-lg bg-white shadow-sm">
          <h2 class="text-xl font-semibold mb-2">Существующие переводы для этого эпизода</h2>
          <div v-if="compositionsPending" class="text-sm text-gray-500">Загрузка...</div>
          <div v-else-if="!existingCompositions || existingCompositions.length === 0" class="text-sm text-gray-500">
            Для этого эпизода еще не создано ни одного перевода.
          </div>
          <div v-else class="space-y-2 text-sm">
            <div v-for="comp in existingCompositions" :key="comp.id"
              class="p-3 bg-green-50 rounded-lg flex justify-between items-center group">
              <div>
                <span class="font-bold text-green-800">{{ comp.name }}</span>
                <!-- ... (отображение деталей сборки) ... -->
              </div>
              <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button @click="startEditing(comp)" title="Редактировать" class="text-gray-400 hover:text-blue-600">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                    <path fill-rule="evenodd"
                      d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"
                      clip-rule="evenodd" />
                  </svg>
                </button>
                <button @click="deleteComposition(comp.id)" title="Удалить" class="text-gray-400 hover:text-red-600">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clip-rule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Блок 2.2: Конструктор/Редактор -->
        <div class="p-4 border rounded-lg bg-white shadow-sm">
          <h2 class="text-xl font-semibold mb-2">{{ editingCompositionId ? 'Редактирование сборки' : 'Создание новой сборки' }}</h2>
          <div class="p-4 my-2 border rounded-md relative"
            :class="editingCompositionId ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700">Аудиопоток</label>
                <select v-model="form.audioStreamId"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm">
                  <option :value="null" disabled>-- Выберите аудио --</option>
                  <option v-for="stream in audioStreams" :key="stream.id" :value="stream.id"
                    :disabled="isAudioStreamUsed(stream.id)">
                    ID {{ stream.id }}: {{ stream.title }} <span
                      v-if="isAudioStreamUsed(stream.id)">(используется)</span>
                  </option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Видеопоток ("Равка")</label>
                <select v-model="form.videoStreamId"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm">
                  <option :value="null" disabled>-- Выберите видео --</option>
                  <option v-for="stream in combinedVideoStreams" :key="stream.id" :value="stream.id">
                    ID {{ stream.id }}: {{ stream.title }} (от {{ stream.uploaderUsername }})
                  </option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Переводчик</label>
                <select v-model="form.translatorId"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm">
                  <option :value="null" disabled>-- Выберите студию --</option>
                  <option v-for="t in translators" :key="t.id" :value="t.id">{{ t.name }}</option>
                  <option :value="-1">-- Создать нового... --</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- Блок 2.3: Сохранение -->
        <div class="flex items-center gap-4 sticky bottom-4">
          <button @click="submitForm" class="px-6 py-3 text-white rounded-lg shadow-lg disabled:opacity-50"
            :class="editingCompositionId ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'"
            :disabled="isSaving || !isFormValid">
            <span v-if="isSaving">Сохранение...</span>
            <span v-else>{{ editingCompositionId ? 'Обновить сборку' : 'Создать новую сборку' }}</span>
          </button>
          <button v-if="editingCompositionId" @click="cancelEditing"
            class="px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 rounded-lg">Отмена</button>
          <div v-if="saveResult" class="p-3 rounded-md text-sm shadow-md"
            :class="saveResult.error ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'">
            {{ saveResult.message }}
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import type { Translator, EpisodeSelection, Composition, Upload } from '~/types'; // Предполагается, что типы обновлены
import EpisodeSelector from '~/components/EpisodeSelector.vue';

interface SaveResult { message: string; error?: boolean; }

const route = useRoute();
const uuid = route.params.uuid as string;

const selectedEpisodeInfo = ref<EpisodeSelection | null>(null);
const existingCompositions = ref<Composition[]>([]);
const availableRaws = ref<{ id: number; title: string | null; uploaderUsername: string | null }[]>([]);
const translators = ref<Translator[]>([]);
const compositionsPending = ref(false);

const form = reactive({
  audioStreamId: null as number | null,
  videoStreamId: null as number | null,
  translatorId: null as number | null,
});
const editingCompositionId = ref<number | null>(null);
const isSaving = ref(false);
const isLinking = ref(false);
const saveResult = ref<SaveResult | null>(null);

const { data: uploadData, pending, error, refresh } = await useAsyncData(
  `upload-data-${uuid}`,
  () => $fetch<{ upload: Upload, existingCompositions: Composition[] }>(`/api/v1/uploads/${uuid}`)
);

const fetchEpisodeData = async (episodeId: number) => {
  compositionsPending.value = true;
  saveResult.value = null;
  try {
    const [comps, raws, trans] = await Promise.all([
      $fetch<Composition[]>(`/api/v1/player/episodes/${episodeId}/translations`),
      $fetch<typeof availableRaws.value>(`/api/v1/episodes/${episodeId}/available-raws`),
      $fetch<Translator[]>('/api/v1/translators'),
    ]);
    existingCompositions.value = comps;
    availableRaws.value = raws;
    translators.value = trans;
  } catch (e) {
    saveResult.value = { message: 'Не удалось загрузить данные для эпизода.', error: true };
  } finally {
    compositionsPending.value = false;
  }
};

const handleEpisodeSelection = (selection: EpisodeSelection | null) => {
  selectedEpisodeInfo.value = selection;
};

async function linkEpisode() {
  if (!selectedEpisodeInfo.value) return;
  isLinking.value = true;
  try {
    await $fetch(`/api/v1/account/uploads/${uuid}/link-episode`, {
      method: 'POST',
      body: { episodeId: selectedEpisodeInfo.value.episodeId }
    });
    await refresh();
  } catch (e: any) {
    alert(`Ошибка: ${e.data?.message || 'Не удалось привязать эпизод'}`);
  } finally {
    isLinking.value = false;
  }
}

const getErrorMessage = (error: any): string => {
  return error.data?.message || 'Произошла неизвестная ошибка';
};

const audioStreams = computed(() => uploadData.value?.upload.mediaStreams.filter(s => s.type === 'AUDIO') ?? []);
const videoStreamFromCurrentUpload = computed(() => uploadData.value?.upload.mediaStreams.find(s => s.type === 'VIDEO'));

const combinedVideoStreams = computed(() => {
  const streamMap = new Map<number, typeof availableRaws.value[0]>();
  // Сначала добавляем равки, пришедшие по API
  availableRaws.value.forEach(raw => streamMap.set(raw.id, raw));

  // Затем добавляем (или перезаписываем) равку из текущей загрузки, чтобы она была в списке
  const currentVid = videoStreamFromCurrentUpload.value;
  if (currentVid) {
    streamMap.set(currentVid.id, {
      id: currentVid.id,
      title: currentVid.title || 'Видео из текущей загрузки',
      uploaderUsername: 'Вы' // Предполагаем, что это текущий пользователь
    });
  }

  return Array.from(streamMap.values());
});


const isAudioStreamUsed = (streamId: number) => {
  return existingCompositions.value
    .filter(c => c.id !== editingCompositionId.value)
    .some(c => c.audioStreamId === streamId);
};
const isFormValid = computed(() => {
  return form.audioStreamId !== null && form.videoStreamId !== null && form.translatorId !== null;
});

const resetForm = () => {
  editingCompositionId.value = null;
  form.audioStreamId = null;
  form.videoStreamId = null;
  form.translatorId = null;
};

const startEditing = (composition: Composition) => {
  editingCompositionId.value = composition.id;
  form.audioStreamId = composition.audioStreamId;
  form.videoStreamId = composition.videoStreamId;
  const translator = translators.value.find(t => t.name === composition.name);
  form.translatorId = translator?.id ?? null;
};

const cancelEditing = () => resetForm();

async function deleteComposition(compositionId: number) {
  if (!confirm('Вы уверены, что хотите удалить эту сборку?')) return;
  saveResult.value = null;
  try {
    await $fetch(`/api/v1/account/compositions/${compositionId}`, { method: 'DELETE' });
    saveResult.value = { message: 'Сборка успешно удалена.' };
    if (uploadData.value?.upload.linkedEpisodeId) {
      await fetchEpisodeData(uploadData.value.upload.linkedEpisodeId);
    }
  } catch (e) {
    saveResult.value = { message: getErrorMessage(e), error: true };
  }
}

async function submitForm() {
  if (!isFormValid.value || !uploadData.value?.upload.linkedEpisodeId) return;
  isSaving.value = true;
  saveResult.value = null;

  const payload = {
    episodeId: uploadData.value.upload.linkedEpisodeId,
    videoStreamId: form.videoStreamId,
    audioStreamId: form.audioStreamId,
    translatorId: form.translatorId,
  };

  try {
    if (editingCompositionId.value) {
      await $fetch(`/api/v1/account/compositions/${editingCompositionId.value}`, { method: 'PUT', body: payload });
      saveResult.value = { message: 'Сборка успешно обновлена.' };
    } else {
      await $fetch(`/api/v1/account/compositions`, { method: 'POST', body: payload });
      saveResult.value = { message: 'Новая сборка успешно создана.' };
    }
    resetForm();
    await fetchEpisodeData(uploadData.value.upload.linkedEpisodeId);
  } catch (e) {
    saveResult.value = { message: getErrorMessage(e), error: true };
  } finally {
    isSaving.value = false;
  }
}

watch(() => uploadData.value?.upload.linkedEpisodeId, (newLinkedId) => {
  if (newLinkedId) {
    fetchEpisodeData(newLinkedId);
  }
}, { immediate: true });

watch(() => form.translatorId, (newVal) => {
  if (newVal === -1) {
    const newName = prompt('Введите название нового переводчика:');
    if (newName) {
      form.translatorId = null;
      createNewTranslator(newName);
    } else {
      form.translatorId = null;
    }
  }
});

async function createNewTranslator(name: string) {
  try {
    const newTranslator = await $fetch<Translator>('/api/v1/admin/translators', {
      method: 'POST',
      body: { name }
    });
    translators.value.push(newTranslator);
    form.translatorId = newTranslator.id;
  } catch (e: any) {
    alert(`Ошибка создания: ${e.data?.message || 'Серверная ошибка'}`);
  }
}
</script>