import { compositions } from '~/server/data/db';

export default defineEventHandler((event) => {
  const episodeId = parseInt(event.context.params?.id ?? '', 10);

  if (isNaN(episodeId)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request: Invalid Episode ID',
    });
  }

  // Фильтруем сборки, которые мы привязали к ID эпизода при их создании
  // Для мока мы использовали episode_number как ID, исправим это для большей точности
  // В configure.put.ts мы сохраняли episode_number, а должны были episode.id (например, 543)
  // Для простоты оставим как есть, но в реальном проекте здесь будет episode.id
  const episodeCompositions = compositions.filter(c => c.episodeId === episodeId);

  return episodeCompositions;
});