import { series } from '~/server/data/db';

export default defineEventHandler((event) => {
    const seriesId = parseInt(event.context.params?.id ?? '', 10);

    if (isNaN(seriesId)) {
        throw createError({ statusCode: 400, message: 'Неверный ID сериала' });
    }

    const seriesIndex = series.findIndex(s => s.id === seriesId);
    if (seriesIndex === -1) {
        throw createError({ statusCode: 404, message: 'Сериал не найден' });
    }

    // Удаляем сериал из массива
    series.splice(seriesIndex, 1);

    setResponseStatus(event, 204); // No Content
    return;
});
