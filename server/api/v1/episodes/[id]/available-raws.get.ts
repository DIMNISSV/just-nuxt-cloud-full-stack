// server/api/v1/episodes/[id]/available-raws.get.ts

import { mediaStreams, uploads, compositions } from '~/server/data/db'; // Добавляем compositions
import { MediaStream } from '~/types';

export default defineEventHandler((event) => {
  const episodeId = parseInt(event.context.params?.id ?? '', 10);
  if (isNaN(episodeId)) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request: Invalid Episode ID' });
  }

  // Используем Map для автоматической дедупликации по ID потока
  const relevantVideoRawsMap = new Map<number, Pick<MediaStream, 'id' | 'title' | 'uploader_username'>>();

  // 1. Находим ВСЕ загрузки, которые привязаны к ТЕКУЩЕМУ эпизоду
  const uploadsForThisEpisode = uploads.filter(u => u.linked_episode_id === episodeId);
  
  // 2. Извлекаем из этих загрузок все их видеопотоки
  uploadsForThisEpisode.forEach(upload => {
    upload.streams
      .filter(stream => stream.stream_type === 'video')
      .forEach(videoStream => {
        relevantVideoRawsMap.set(videoStream.id, {
          id: videoStream.id,
          title: videoStream.title || upload.original_filename || 'Видео из загрузки',
          uploader_username: videoStream.uploader_username
        });
      });
  });

  // 3. Дополнительно находим видеопотоки, которые уже используются в существующих сборках для этого эпизода.
  // Это гарантирует, что даже если исходная загрузка была удалена, равку можно будет выбрать для редактирования.
  const compositionsForThisEpisode = compositions.filter(c => c.episodeId === episodeId);

  compositionsForThisEpisode.forEach(composition => {
    // Проверяем, что этот видеопоток еще не был добавлен на шаге 2
    if (!relevantVideoRawsMap.has(composition.video_stream_id)) {
      const videoStream = mediaStreams.find(s => s.id === composition.video_stream_id);
      if (videoStream) {
        relevantVideoRawsMap.set(videoStream.id, {
          id: videoStream.id,
          title: videoStream.title || 'Видео из существующей сборки',
          uploader_username: videoStream.uploader_username
        });
      }
    }
  });

  // Возвращаем уникальные видеопотоки в виде массива
  return Array.from(relevantVideoRawsMap.values());
});