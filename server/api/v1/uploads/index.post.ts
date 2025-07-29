import { uploads } from '~/server/data/db';
import type { Upload, UploadType } from '~/types';
import { v4 as uuidv4 } from 'uuid';

// Установите uuid: npm install uuid @types/uuid
// Мы будем использовать настоящие UUID для новых загрузок

export default defineEventHandler(async (event) => {
    // Здесь в будущем будет проверка авторизации, чтобы получить ID пользователя
    const MOCK_USER_ID = 1; // Пока используем заглушку

    const body = await readBody(event);
    const { type, sources } = body as { type: UploadType, sources: string[] };

    if (!type || !sources || !Array.isArray(sources) || sources.length === 0) {
        throw createError({ statusCode: 400, message: 'Неверный формат запроса' });
    }

    const newUploads: Upload[] = [];

    for (const source of sources) {
        const newUpload: Upload = {
            id: Date.now() + Math.random(),
            uuid: uuidv4(),
            status: 'new', // Все новые загрузки начинают с этого статуса
            type: type,
            source: source,
            original_filename: source.split('/').pop() || source, // Упрощенное получение имени файла
            streams: [],
            linked_episode_id: null,
            userId: MOCK_USER_ID,
            createdAt: new Date().toISOString(),
        };
        uploads.push(newUpload);
        newUploads.push(newUpload);
    }

    setResponseStatus(event, 202); // 202 Accepted - задача принята на обработку
    return newUploads;
});