import { uploads } from '~/server/data/db';

export default defineEventHandler((event) => {
    const uuid = event.context.params?.uuid ?? '';
    if (!uuid) throw createError({ statusCode: 400, statusMessage: 'Bad Request: UUID is required' });
    
    const uploadIndex = uploads.findIndex(u => u.uuid === uuid);
    if (uploadIndex === -1) throw createError({ statusCode: 404, message: 'Загрузка не найдена' });

    // В реальной системе здесь также нужно было бы удалить связанные файлы и сборки
    uploads.splice(uploadIndex, 1);

    setResponseStatus(event, 204);
    return;
});