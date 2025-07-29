import { alert } from '#build/ui';
import { uploads, compositions } from '~/server/data/db';
import type { Composition, Upload } from '~/types';

// Определяем тип для успешного ответа нашего API
interface UploadDetailsResponse {
  upload: Upload;
  existingCompositions: Partial<Composition>[];
}

export default defineEventHandler((event): UploadDetailsResponse => {
  const uuid = event.context.params?.uuid;

  // 1. Валидация UUID
  if (!uuid) throw createError({ statusCode: 400, statusMessage: 'Bad Request: UUID is required' });

  // 2. Поиск самой загрузки
  const foundUpload = uploads.find(u => u.uuid === uuid);

  if (!foundUpload) throw createError({ statusCode: 404, statusMessage: 'Upload Not Found' });

  // 3. Получение ID эпизода из query-параметра (его может и не быть)
  const query = getQuery(event);
  const episodeId = parseInt(query.episodeId as string, 10);

  // 4. Инициализация переменной для существующих сборок
  let existingCompositions: Partial<Composition>[] = [];

  // 5. Поиск сборок, только если ID эпизода передан и он валиден
  if (!isNaN(episodeId)) {
    existingCompositions = compositions
      .filter(c => c.episodeId === episodeId)
      .map(c => ({
        // Возвращаем только те поля, которые нужны UI
        id: c.id,
        name: c.name,
        player_config: c.player_config,
        audio_stream_id: c.audio_stream_id,
        video_stream_id: c.video_stream_id,
      }));
  }

  // 6. Возвращаем полный объект ответа
  return {
    upload: foundUpload,
    existingCompositions: existingCompositions
  };
});