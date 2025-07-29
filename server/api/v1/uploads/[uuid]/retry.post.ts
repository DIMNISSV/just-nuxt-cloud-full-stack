import { uploads } from '~/server/data/db';

export default defineEventHandler(async (event) => {
    const uuid = event.context.params?.uuid;
    const upload = uploads.find(u => u.uuid === uuid);

    if (!upload) {
        throw createError({ statusCode: 404, message: 'Загрузка не найдена' });
    }
    if (upload.status !== 'error') {
        throw createError({ statusCode: 400, message: 'Повторить можно только ошибочную загрузку' });
    }

    // Сбрасываем статус на "new", чтобы симулятор его подхватил
    upload.status = 'new';
    upload.statusMessage = undefined;

    return { message: 'Загрузка поставлена в очередь на повторную обработку.' };
});