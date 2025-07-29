import { series } from '~/server/data/db';

export default defineEventHandler(async (event) => {
    const seriesId = parseInt(event.context.params?.id ?? '', 10);
    const body = await readBody(event);
    const { title, poster_url } = body;

    if (isNaN(seriesId)) {
        throw createError({ statusCode: 400, message: 'Неверный ID сериала' });
    }
    if (!title) {
        throw createError({ statusCode: 400, message: 'Название сериала обязательно' });
    }

    const seriesIndex = series.findIndex(s => s.id === seriesId);
    if (seriesIndex === -1) {
        throw createError({ statusCode: 404, message: 'Сериал не найден' });
    }

    // Обновляем данные
    series[seriesIndex].title = title;
    series[seriesIndex].poster_url = poster_url;

    return series[seriesIndex];
});