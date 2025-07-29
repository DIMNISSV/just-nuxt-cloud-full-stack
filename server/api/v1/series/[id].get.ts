import { series } from '~/server/data/db';

export default defineEventHandler((event) => {
  // Добавляем проверку, чтобы удовлетворить TypeScript
  const seriesId = parseInt(event.context.params?.id ?? '', 10);

  // Проверяем, удалось ли распарсить ID
  if (isNaN(seriesId)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request: Invalid Series ID',
    });
  }

  const foundSeries = series.find(s => s.id === seriesId);

  if (!foundSeries) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Series Not Found',
    });
  }

  return foundSeries;
});