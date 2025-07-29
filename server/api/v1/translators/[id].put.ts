import { translators } from '~/server/data/db';

export default defineEventHandler(async (event) => {
    const translatorId = parseInt(event.context.params?.id ?? '', 10);
    const { name } = await readBody(event);
    if (isNaN(translatorId)) throw createError({ statusCode: 400, message: 'Неверный ID' });
    if (!name) throw createError({ statusCode: 400, message: 'Имя обязательно' });

    const translatorIndex = translators.findIndex(t => t.id === translatorId);
    if (translatorIndex === -1) throw createError({ statusCode: 404, message: 'Переводчик не найден' });

    translators[translatorIndex].name = name;
    return translators[translatorIndex];
});