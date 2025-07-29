import { series } from '~/server/data/db';
import type { Series } from '~/types';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { title, poster_url } = body;

    if (!title) {
        throw createError({ statusCode: 400, message: 'Название сериала обязательно' });
    }

    const newSeries: Series = {
        id: Date.now(), // Уникальный ID
        title: title,
        poster_url: poster_url || 'https://placehold.co/400x600/cccccc/e2e8f0?text=No+Image',
        seasons: [], // Новый сериал создается без сезонов
    };

    series.push(newSeries);

    setResponseStatus(event, 201); // 201 Created
    return newSeries;
});