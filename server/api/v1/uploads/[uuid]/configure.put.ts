import { compositions, translators, mediaStreams } from '~/server/data/db';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  // Валидация тела запроса
  if (!body.compositions || !Array.isArray(body.compositions)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid request body' });
  }

  const episodeId = body.episode_identity.episodeId;

  // --- Валидация на дубликаты ---
  const usedAudioStreamIds = compositions
    .filter(c => c.episodeId === episodeId)
    .map(c => c.audio_stream_id);

  for (const comp of body.compositions) {
    if (usedAudioStreamIds.includes(comp.audio_stream_id)) {
      const usedStream = mediaStreams.find(s => s.id === comp.audio_stream_id);
      throw createError({
        statusCode: 409,
        statusMessage: `Ошибка: Аудиопоток "${usedStream?.title}" (ID: ${comp.audio_stream_id}) уже используется.`
      });
    }
  }

  // --- Логика создания ---
  for (const comp of body.compositions) {
    const video = mediaStreams.find(s => s.id === comp.video_stream_id);
    const audio = mediaStreams.find(s => s.id === comp.audio_stream_id);
    const translator = translators.find(t => t.id === comp.translator_id);
    const subtitles = mediaStreams.filter(s => comp.linked_subtitle_stream_ids?.includes(s.id));
    console.log('TEST', mediaStreams, video, audio, translator)

    // ЭТОТ КОД СЛИШКОМ ЧАСТО ДУБЛИУРЕТСЯ,
    const genId = () => parseInt(`${Date.now()}${Math.round(Math.random() * 100)}`);
    // НЕОБХОДИМО ПЕРЕНЕСТИ В УТИЛИТЫ.

    if (video && audio && translator) {
      const newComposition = {
        id: genId(), // Math.random чтобы избежать коллизий при быстрой отправке
        name: translator.name,
        episodeId: episodeId,
        video_stream_id: video.id,
        audio_stream_id: audio.id,
        player_config: {
          video: video.file_path,
          audio: [{ title: audio.title ?? 'Audio', src: audio.file_path }],
          subtitles: subtitles.map(sub => ({ title: sub.title ?? 'Subtitle', src: sub.file_path }))
        }
      };
      compositions.push(newComposition);
    }
  }

  setResponseStatus(event, 200);
  return {
    message: `Конфигурация сохранена. Создано сборок: ${body.compositions.length}.`,
    totalCompositions: compositions.length
  };
});