import { series } from '~/server/data/db';
import { ExternalDbType } from '~/types';

export default defineEventHandler(async (event) => {
    const episodeId = parseInt(event.context.params?.id ?? '', 10);
    const { title, external_ids } = await readBody(event) as {
        title: string;
        external_ids?: { [key in ExternalDbType]?: string };
    };

    if (isNaN(episodeId)) throw createError({ statusCode: 400, message: 'Неверный ID эпизода' });

    for (const s of series) {
        for (const season of s.seasons) {
            const episodeIndex = season.episodes.findIndex(e => e.id === episodeId);
            if (episodeIndex !== -1) {
                // 1. Обновляем основные данные
                season.episodes[episodeIndex].title = title !== undefined ? title : season.episodes[episodeIndex].title;
                // 2. Обновляем или добавляем external_ids
                season.episodes[episodeIndex].external_ids = external_ids || {};

                // 3. ★ ОБНОВЛЯЕМ "КОПИЛКУ" РОДИТЕЛЯ ★
                if (external_ids) {
                    for (const source in external_ids) {
                        const dbType = source as ExternalDbType;
                        const idToAdd = external_ids[dbType];

                        if (idToAdd) {
                            if (!s.external_ids[dbType]) s.external_ids[dbType] = [];
                            if (!s.external_ids[dbType]!.includes(idToAdd)) {
                                s.external_ids[dbType]!.push(idToAdd);
                            }
                        }
                    }
                }

                return season.episodes[episodeIndex];
            }
        }
    }

    throw createError({ statusCode: 404, message: 'Эпизод не найден' });
});