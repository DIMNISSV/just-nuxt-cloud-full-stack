import { uploads } from '~/server/data/db';

export default defineEventHandler(async (event) => {
    const uuid = event.context.params?.uuid;
    const body = await readBody(event);
    const episodeId = body.episodeId as number;

    if (!uuid || !episodeId) {
        throw createError({ statusCode: 400, statusMessage: 'UUID и Episode ID обязательны' });
    }

    const uploadIndex = uploads.findIndex(u => u.uuid === uuid);
    if (uploadIndex === -1) {
        throw createError({ statusCode: 404, statusMessage: 'Загрузка не найдена' });
    }

    if (uploads[uploadIndex].linked_episode_id !== null) {
        throw createError({
            statusCode: 409, // Conflict
            statusMessage: 'Эта загрузка уже привязана к другому эпизоду.'
        });
    }

    // Привязываем загрузку к эпизоду
    uploads[uploadIndex].linked_episode_id = episodeId;

    return {
        message: 'Загрузка успешно привязана к эпизоду.'
    };
});