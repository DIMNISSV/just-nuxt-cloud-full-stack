import { translators } from '~/server/data/db';
import type { Translator } from '~/types';

export default defineEventHandler(async (event) => {
    const { name } = await readBody(event);
    if (!name) throw createError({ statusCode: 400, message: 'Имя переводчика обязательно' });

    if (translators.some(t => t.name.toLowerCase() === name.toLowerCase())) {
        throw createError({ statusCode: 409, message: 'Такой переводчик уже существует' });
    }

    const newTranslator: Translator = { id: Date.now(), name };
    translators.push(newTranslator);
    setResponseStatus(event, 201);
    return newTranslator;
});