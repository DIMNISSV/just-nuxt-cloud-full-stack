import { compositions, translators, mediaStreams } from '~/server/data/db';

export default defineEventHandler(async (event) => {
  const compositionId = parseFloat(event.context.params?.id ?? '');
  const body = await readBody(event);

  // --- Валидация ---
  if (isNaN(compositionId)) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request: Invalid Composition ID' });
  }
  if (!body || !body.audio_stream_id || !body.video_stream_id || !body.translator_id) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request: Missing required fields' });
  }

  // --- Поиск сборки ---
  const compositionIndex = compositions.findIndex(c => c.id === compositionId);
  if (compositionIndex === -1) {
    throw createError({ statusCode: 404, statusMessage: 'Composition not found' });
  }

  // --- Проверка на конфликт аудиодорожки (важно!) ---
  // Проверяем, не пытается ли пользователь присвоить аудиодорожку, которая уже занята ДРУГОЙ сборкой.
  const episodeId = compositions[compositionIndex].episodeId;
  const conflictingComposition = compositions.find(c => 
    c.episodeId === episodeId &&                  // в том же эпизоде
    c.audio_stream_id === body.audio_stream_id && // с тем же аудио
    c.id !== compositionId                        // но это не та сборка, которую мы редактируем
  );

  if (conflictingComposition) {
    const usedStream = mediaStreams.find(s => s.id === body.audio_stream_id);
    throw createError({ 
      statusCode: 409,
      statusMessage: `Ошибка: Аудиопоток "${usedStream?.title}" уже используется в сборке "${conflictingComposition.name}".` 
    });
  }

  // --- Обновление данных ---
  const translator = translators.find(t => t.id === body.translator_id);
  const video = mediaStreams.find(s => s.id === body.video_stream_id);
  const audio = mediaStreams.find(s => s.id === body.audio_stream_id);

  if (!translator || !video || !audio) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid stream or translator ID provided' });
  }
  
  // Обновляем поля существующей сборки
  compositions[compositionIndex] = {
    ...compositions[compositionIndex], // Сохраняем старые поля (id, episodeId)
    name: translator.name,
    video_stream_id: video.id,
    audio_stream_id: audio.id,
    player_config: {
      video: video.file_path,
      audio: [{ title: audio.title ?? 'Audio', src: audio.file_path }],
      subtitles: [] // Упрощенно
    }
  };

  // Возвращаем обновленный объект
  return compositions[compositionIndex];
});