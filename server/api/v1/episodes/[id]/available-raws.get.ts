// server/api/v1/episodes/[id]/available-raws.get.ts
import { mediaStreams } from '~/server/data/db';

export default defineEventHandler((event) => {
  // Для мока мы пока игнорируем ID эпизода и возвращаем все видеопотоки.
  // В реальном API здесь была бы фильтрация по episodeId.
  const episodeId = parseInt(event.context.params?.id ?? '', 10);

  const allVideoRaws = mediaStreams
    .filter(stream => stream.stream_type === 'video')
    .map(stream => ({
      // Возвращаем только те поля, которые нужны UI
      id: stream.id,
      title: stream.title,
      uploader_username: stream.uploader_username
    }));

  return allVideoRaws;
});