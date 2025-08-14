

import prisma from '~/server/utils/prisma'
import { generateDownloadUrl } from '~/server/utils/s3'
import { NodeType } from '@prisma/client'

export default defineEventHandler(async (event) => {
    
    const user = event.context.user;
    if (!user) {
        throw createError({ statusCode: 401, message: 'Требуется авторизация' });
    }

    const uuid = event.context.params?.uuid;
    if (!uuid) {
        throw createError({ statusCode: 400, message: 'Не указан UUID файла' });
    }

    const node = await prisma.storageNode.findUnique({
        where: { uuid: uuid },
    });

    
    if (!node || node.ownerId !== user.userId) {
        throw createError({ statusCode: 404, message: 'Файл не найден или у вас нет к нему доступа.' });
    }
    if (node.type !== NodeType.FILE) {
        throw createError({ statusCode: 400, message: 'Скачивать можно только файлы.' });
    }
    if (!node.s3Key) {
        throw createError({ statusCode: 500, message: 'У файла отсутствует ключ для хранилища.' });
    }

    
    const downloadUrl = await generateDownloadUrl(node.s3Key, node.name);

    return {
        downloadUrl,
        filename: node.name,
    };
});