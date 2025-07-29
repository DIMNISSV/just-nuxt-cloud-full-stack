import { translators } from '~/server/data/db';

export default defineEventHandler((event) => {
    const translatorId = parseInt(event.context.params?.id ?? '', 10);
    if (isNaN(translatorId)) throw createError({ statusCode: 400, message: 'Неверный ID' });

    const translatorIndex = translators.findIndex(t => t.id === translatorId);
    if (translatorIndex === -1) throw createError({ statusCode: 404, message: 'Переводчик не найден' });

    translators.splice(translatorIndex, 1);
    setResponseStatus(event, 204);
    return;
});