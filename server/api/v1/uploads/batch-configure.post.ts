import { uploads, series, compositions, mediaStreams } from '~/server/data/db';
import type { Upload, Episode, Series, Season } from '~/types';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { uploadIds, startEpisodeId, autoCreateEpisodes } = body as {
        uploadIds: number[],
        startEpisodeId: number | null, // Может быть null
        autoCreateEpisodes: boolean
    };

    if (!uploadIds || !Array.isArray(uploadIds)) {
        throw createError({ statusCode: 400, message: 'Необходимы ID загрузок' });
    }

    // --- Находим все нужные нам сущности ---
    const uploadsToConfigure = uploads.filter(u => uploadIds.includes(u.id));

    let startEpisode: Episode | null = null;
    let targetSeries: Series | undefined = undefined;
    let targetSeason: Season | undefined = undefined;
    let startEpisodeIndex = -1;

    // Сценарий 1: Указан конкретный стартовый эпизод
    if (startEpisodeId) {
        for (const s of series) {
            for (const season of s.seasons) {
                const episodeIndex = season.episodes.findIndex(e => e.id === startEpisodeId);
                if (episodeIndex !== -1) {
                    startEpisode = season.episodes[episodeIndex];
                    targetSeries = s;
                    targetSeason = season;
                    startEpisodeIndex = episodeIndex;
                    break;
                }
            }
            if (startEpisode) break;
        }
    }
    // Сценарий 2: Стартовый эпизод не указан (например, для нового сериала)
    else if (autoCreateEpisodes) {
        // Пытаемся найти сериал, к которому относится первая загрузка
        // (в реальной жизни здесь была бы более сложная логика, например, выбор сериала в UI)
        // Для мока возьмем первый попавшийся сериал или создадим новый, если их нет.
        if (series.length > 0) {
            targetSeries = series[0];
        } else {
            // Если сериалов вообще нет, то эта логика не сработает без создания сериала.
            // Для мокапа предположим, что хотя бы один сериал уже существует.
            throw createError({ statusCode: 404, message: 'Не найдено ни одного сериала для автоматической привязки.' });
        }

        targetSeason = targetSeries.seasons.find(s => s.season_number === 1);
        if (!targetSeason) {
            targetSeason = { season_number: 1, episodes: [] };
            targetSeries.seasons.push(targetSeason);
        }

        // Мы начинаем с "виртуального" первого эпизода.
        // Дальнейшая логика создаст его по-настоящему.
        startEpisode = { id: 0, episode_number: 1, title: '' };
        startEpisodeIndex = -1; // Указывает, что эпизод еще не существует
    }

    // Финальная проверка
    if (!startEpisode || !targetSeries || !targetSeason) {
        throw createError({ statusCode: 404, message: 'Стартовый эпизод не найден' });
    }

    // --- Основная логика ---
    let configuredCount = 0;
    for (const [index, upload] of uploadsToConfigure.entries()) {
        if (upload.linked_episode_id) continue;

        const currentEpisodeNumber = startEpisode.episode_number + index;
        let currentEpisode = targetSeason.episodes.find(e => e.episode_number === currentEpisodeNumber);
        const genId = () => parseInt(`${Date.now()}${Math.round(Math.random() * 100)}`);
        
        // Логика автосоздания эпизода
        if (!currentEpisode) {
            if (autoCreateEpisodes) {
                currentEpisode = {
                    id: genId(),
                    episode_number: currentEpisodeNumber,
                    title: `Эпизод ${currentEpisodeNumber}`,
                    external_ids: {}
                };
                targetSeason.episodes.push(currentEpisode);
            } else {
                break; // Если автосоздание выключено и эпизода нет, прекращаем
            }
        }

        // 1. Привязываем upload к эпизоду
        upload.linked_episode_id = currentEpisode.id;

        // 2. Имитируем создание базовой сборки (если есть потоки)
        const audioStream = upload.streams.find(s => s.stream_type === 'audio');
        const videoStream = upload.streams.find(s => s.stream_type === 'video');

        if (audioStream && videoStream) {
            const existingComposition = compositions.find(c => c.episodeId === currentEpisode!.id && c.audio_stream_id === audioStream.id);
            console.log('DEBUG', existingComposition);

            if (!existingComposition) {
                compositions.push({
                    id: genId(),
                    name: audioStream.title || 'Auto-configured',
                    episodeId: currentEpisode.id,
                    video_stream_id: videoStream.id,
                    audio_stream_id: audioStream.id,
                    player_config: { video: videoStream.file_path, audio: [{ title: audioStream.title ?? 'Audio', src: audioStream.file_path }], subtitles: [] }
                });
            }
        }
        configuredCount++;
    }

    // Сортируем эпизоды после добавления новых
    targetSeason.episodes.sort((a, b) => a.episode_number - b.episode_number);

    return { message: `Успешно настроено ${configuredCount} из ${uploadsToConfigure.length} загрузок.` };
});