import { series } from '~/server/data/db';
import type { Episode } from '~/types';
import { ExternalDbType } from '~/types';

export default defineEventHandler(async (event) => {
    const seriesId = parseInt(event.context.params?.id ?? '', 10);
    const body = await readBody(event);
    const { season_number, episode_number, title, external_ids } = body as {
        season_number: number;
        episode_number: number;
        title: string;
        external_ids?: { [key in ExternalDbType]?: string };
    };

    if (isNaN(seriesId)) throw createError({ statusCode: 400, message: 'Неверный ID сериала' });
    if (!season_number || !episode_number) throw createError({ statusCode: 400, message: 'Номер сезона и эпизода обязательны' });

    const seriesIndex = series.findIndex(s => s.id === seriesId);
    if (seriesIndex === -1) throw createError({ statusCode: 404, message: 'Сериал не найден' });

    let season = series[seriesIndex].seasons.find(s => s.season_number === season_number);
    if (!season) {
        season = { season_number: season_number, episodes: [] };
        series[seriesIndex].seasons.push(season);
    }

    const episodeExists = season.episodes.some(e => e.episode_number === episode_number);
    if (episodeExists) throw createError({ statusCode: 409, message: 'Эпизод с таким номером уже существует в этом сезоне' });

    const newEpisode: Episode = {
        id: Date.now(),
        episode_number: episode_number,
        title: title || `Эпизод ${episode_number}`,
        external_ids: external_ids || {}, // Добавляем external_ids, если они переданы
    };

    season.episodes.push(newEpisode);

    // ★ НОВАЯ ЛОГИКА: Обновление "копилки" ID у родительского сериала ★
    if (external_ids) {
        for (const source in external_ids) {
            const dbType = source as ExternalDbType;
            const idToAdd = external_ids[dbType];

            if (idToAdd) {
                // Инициализируем массив для источника, если его еще нет
                if (!series[seriesIndex].external_ids[dbType]) {
                    series[seriesIndex].external_ids[dbType] = [];
                }
                // Добавляем ID в "копилку", только если его там еще нет
                if (!series[seriesIndex].external_ids[dbType]!.includes(idToAdd)) {
                    series[seriesIndex].external_ids[dbType]!.push(idToAdd);
                }
            }
        }
    }

    // Сортировка
    season.episodes.sort((a, b) => a.episode_number - b.episode_number);
    series[seriesIndex].seasons.sort((a, b) => a.season_number - b.season_number);

    setResponseStatus(event, 201);
    return newEpisode;
});