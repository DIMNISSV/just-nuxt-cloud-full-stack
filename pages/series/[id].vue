<template>
  <!-- 1. Обработка состояния загрузки -->
  <div v-if="pending" class="text-gray-500 text-center py-10">Загрузка сериала...</div>
  
  <!-- 2. Обработка ошибки -->
  <div v-else-if="error" class="p-4 bg-red-100 text-red-800 rounded-lg">
    <h2 class="text-xl font-bold">Ошибка загрузки</h2>
    <!-- Теперь TypeScript знает, что у error.data может быть message -->
    <p>{{ error.data?.message || error.statusMessage || 'Произошла непредвиденная ошибка' }}</p>
  </div>
  
  <!-- 3. Отображение данных, только если они есть (series не null) -->
  <div v-else-if="series" class="grid grid-cols-1 md:grid-cols-3 gap-6">
    
    <!-- Левая колонка: Постер и эпизоды -->
    <aside class="md:col-span-1 space-y-6">
      <div class="p-4 border rounded-lg bg-white shadow-sm">
        <img :src="series.posterUrl" :alt="series.title" class="w-full rounded-lg shadow-lg mb-4">
        <h1 class="text-3xl font-bold">{{ series.title }}</h1>
      </div>
      <div v-for="season in series.seasons" :key="season.seasonNumber" class="p-4 border rounded-lg bg-white shadow-sm">
        <h2 class="text-xl font-semibold mb-3 border-b pb-2">Сезон {{ season.seasonNumber }}</h2>
        <ul class="space-y-1">
          <li v-for="episode in season.episodes" :key="episode.id">
            <button 
              @click="selectEpisode(episode)"
              class="w-full text-left p-2 rounded transition-colors"
              :class="selectedEpisode?.id === episode.id ? 'bg-blue-100 text-blue-800 font-semibold' : 'hover:bg-gray-100'"
            >
              Эпизод {{ episode.episodeNumber }}: {{ episode.title }}
            </button>
          </li>
        </ul>
      </div>
    </aside>

    <!-- Правая колонка: Плеер -->
    <div class="md:col-span-2 p-4 border rounded-lg bg-white shadow-sm sticky top-4">
      <h2 class="text-2xl font-semibold mb-4">Плеер</h2>
      <div v-if="!selectedEpisode" class="h-64 flex items-center justify-center bg-gray-100 rounded">
        <p class="text-gray-500">Выберите эпизод для просмотра</p>
      </div>
      <div v-else>
        <h3 class="text-lg mb-4 pb-2 border-b">
          Выбран: <span class="font-semibold">{{ selectedEpisode.title }}</span>
        </h3>

        <div v-if="player.isLoading" class="text-gray-500">Загрузка переводов...</div>
        <div v-else-if="player.error" class="text-red-500">Ошибка загрузки переводов.</div>
        <div v-else-if="player.translations.length === 0" class="p-3 bg-yellow-100 text-yellow-800 rounded text-sm">
          Для этого эпизода пока нет доступных переводов. <NuxtLink :to="`/account/uploads/`" class="font-semibold underline">Добавить?</NuxtLink>
        </div>
        
        <div v-else class="space-y-4">
          <div>
            <h4 class="text-sm font-medium mb-2 text-gray-600">Доступные переводы:</h4>
            <div class="flex flex-wrap gap-2">
              <button 
                v-for="trans in player.translations" 
                :key="trans.name"
                @click="activePlayerConfig = trans.player_config"
                class="px-4 py-2 rounded-lg border transition-colors"
                :class="activePlayerConfig === trans.player_config ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-100'"
              >
                {{ trans.name }}
              </button>
            </div>
          </div>
          
          <div v-if="activePlayerConfig" class="p-4 bg-gray-800 text-white font-mono rounded-lg text-sm overflow-x-auto">
            <h4 class="font-sans text-xs text-gray-400 mb-2 uppercase">Конфигурация для PlayerJS:</h4>
            <pre><code>{{ JSON.stringify(activePlayerConfig, null, 2) }}</code></pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import type { Series, Episode, Composition } from '~/types';
import { FetchError } from 'ofetch'; // Импортируем тип ошибки

const route = useRoute();
const seriesId = route.params.id;
// const testUploadUuid = 'f1e2d3c4-b5a6-4f7e-8c9d-0a1b2c3d4e5f';

// --- Состояние страницы ---
const selectedEpisode = ref<Episode | null>(null);
const activePlayerConfig = ref<Composition['player_config'] | null>(null);
const player = reactive({
  isLoading: false,
  error: null as Error | null,
  translations: [] as Composition[],
});

// --- Загрузка данных ---

// Мы указываем только один дженерик - тип для УСПЕШНОГО ответа.
// TypeScript теперь сам правильно выведет тип для `error` как Ref<FetchError | null>
const { data: series, pending, error } = await useFetch<Series>(`/api/v1/series/${seriesId}`);

// Мы проверяем, существует ли ошибка. Если да, то TypeScript теперь знает,
// что `error.value` это объект `FetchError`, у которого есть `statusCode`.
if (error.value) {
  if (error.value.statusCode === 404) {
    // showError - это встроенная функция Nuxt для отображения страницы ошибки
    showError({ statusCode: 404, statusMessage: 'Сериал не найден' });
  } else {
    // Обработка всех других серверных ошибок
    showError({ 
      statusCode: error.value.statusCode, 
      statusMessage: error.value.statusMessage || 'Произошла ошибка на сервере' 
    });
  }
}

// --- Методы ---
const selectEpisode = (episode: Episode) => {
  selectedEpisode.value = episode;
  activePlayerConfig.value = null; 
};

watch(selectedEpisode, async (newEpisode) => {
  if (!newEpisode) {
    player.translations = [];
    return;
  }
  
  player.isLoading = true;
  player.error = null;
  player.translations = [];

  try {
    const translationsData = await $fetch<Composition[]>(`/api/v1/player/episodes/${newEpisode.id}/translations`);
    player.translations = translationsData;
    
    if (translationsData.length > 0) {
      activePlayerConfig.value = translationsData[0].player_config;
    }
  } catch (e) {
    // В блоке catch ошибка все еще `unknown`, поэтому проверка нужна,
    // но основная ошибка загрузки страницы теперь обрабатывается выше.
    console.error("Ошибка загрузки переводов:", e);
    player.error = e instanceof Error ? e : new Error('Failed to fetch translations');
  } finally {
    player.isLoading = false;
  }
});
</script>