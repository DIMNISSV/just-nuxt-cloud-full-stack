import { uploads, series, compositions, mediaStreams } from '~/server/data/db';
import type { Upload, Episode } from '~/types';
import { v4 as uuidv4 } from 'uuid';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { uploadIds, startEpisodeId, autoCreateEpisodes } = body as {
        uploadIds: number[],
        startEpisodeId: number,
        autoCreateEpisodes: boolean
    };

    if (!uploadIds || !startEpisodeId) {
        throw createError({ statusCode: 400, message: 'Необходимы ID загрузок и стартовый эпизод' });
    }

    // --- Находим все нужные нам сущности ---
    const uploadsToConfigure = uploads.filter(u => uploadIds.includes(u.id));

    let startEpisode: Episode | null = null;
    let startSeriesId: number | null = null;
    let startSeasonIndex = -1;
    let startEpisodeIndex = -1;

    for (const s of series) {
        for (const [i_season, season] of s.seasons.entries()) {
            const i_episode = season.episodes.findIndex(e => e.id === startEpisodeId);
            if (i_episode !== -1) {
                startEpisode = season.episodes[i_episode];
                startSeriesId = s.id;
                startSeasonIndex = i_season;
                startEpisodeIndex = i_episode;
                break;
            }
        }
        if (startEpisode) break;
    }

    if (!startEpisode || startSeriesId === null) {
        throw createError({ statusCode: 404, message: 'Стартовый эпизод не найден' });
    }

    // --- Основная логика ---
    let configuredCount = 0;
    for (const [index, upload] of uploadsToConfigure.entries()) {
        if (upload.linked_episode_id) continue;

        const currentEpisodeNumber = startEpisode.episode_number + index;
        const targetSeries = series.find(s => s.id === startSeriesId);
        if (!targetSeries) continue; // На всякий случай
        const targetSeason = targetSeries.seasons[startSeasonIndex];
        if (!targetSeason) continue; // На всякий случай

        let currentEpisode = targetSeason.episodes.find(e => e.episode_number === currentEpisodeNumber);

        // Логика автосоздания эпизода
        if (!currentEpisode) {
            if (autoCreateEpisodes) {
                currentEpisode = {
                    id: Date.now() + Math.random(),
                    episode_number: currentEpisodeNumber,
                    title: `Эпизод ${currentEpisodeNumber}`
                };
                targetSeason.episodes.push(currentEpisode);
                console.log(`[Batch Configure] Создан новый эпизод #${currentEpisodeNumber} для сезона ${targetSeason.season_number}`);
            } else {
                // Если автосоздание выключено и эпизода нет, прекращаем
                break;
            }
        }

        // 1. Привязываем upload к эпизоду
        upload.linked_episode_id = currentEpisode.id;

        // 2. Имитируем создание базовой сборки
        const audioStream = upload.streams.find(s => s.stream_type === 'audio');
        const videoStream = upload.streams.find(s => s.stream_type === 'video') || mediaStreams.find(s => s.stream_type === 'video'); // своя равка или первая попавшаяся

        if (audioStream && videoStream) {
            compositions.push({
                id: Date.now() + Math.random(),
                name: audioStream.title || 'Неизвестный переводчик',
                episodeId: currentEpisode.id,
                video_stream_id: videoStream.id,
                audio_stream_id: audioStream.id,
                player_config: { video: videoStream.file_path, audio: [{ title: audioStream.title ?? 'Audio', src: audioStream.file_path }], subtitles: [] }
            });
        }
        configuredCount++;
    }

    // Сортируем эпизоды после добавления новых
    const targetSeason = series.find(s => s.id === startSeriesId)?.seasons[startSeasonIndex];
    if (targetSeason) {
        targetSeason.episodes.sort((a, b) => a.episode_number - b.episode_number);
    }

    return { message: `Успешно настроено ${configuredCount} из ${uploadIds.length} загрузок.` };
});