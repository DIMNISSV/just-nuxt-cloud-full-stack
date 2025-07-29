import { series } from '~/server/data/db';

export default defineEventHandler((event) => {
    const episodeId = parseInt(event.context.params?.id ?? '', 10);
    if (isNaN(episodeId)) throw createError({ statusCode: 400, message: 'Неверный ID эпизода' });

    for (const s of series) {
        for (const season of s.seasons) {
            const episodeIndex = season.episodes.findIndex(e => e.id === episodeId);
            if (episodeIndex !== -1) {
                season.episodes.splice(episodeIndex, 1);
                setResponseStatus(event, 204);
                return;
            }
        }
    }

    throw createError({ statusCode: 404, message: 'Эпизод не найден' });
});