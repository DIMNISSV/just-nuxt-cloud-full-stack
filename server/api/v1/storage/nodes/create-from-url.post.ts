// server/api/v1/storage/nodes/create-from-url.post.ts

import prisma from '~/server/utils/prisma'
import { addDownloadUrlJob } from '~/server/utils/queue'
import { NodeType, NodeStatus } from '@prisma/client'

interface CreateFromUrlPayload {
    sourceUrl: string;
    parentUuid: string | null;
}

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user) {
        throw createError({ statusCode: 401, message: 'Требуется авторизация' });
    }

    const { sourceUrl, parentUuid } = await readBody<CreateFromUrlPayload>(event);
    if (!sourceUrl) {
        throw createError({ statusCode: 400, message: 'Необходимо указать URL источника' });
    }

    let parentId: number | null = null;
    if (parentUuid) {
        const parentNode = await prisma.storageNode.findUnique({ where: { uuid: parentUuid, ownerId: user.userId } });
        if (!parentNode) {
            throw createError({ statusCode: 404, message: 'Родительская папка не найдена' });
        }
        parentId = parentNode.id;
    }

    // Пытаемся извлечь имя файла из URL
    let filename = 'downloaded_file';
    try {
        const url = new URL(sourceUrl);
        const pathnameParts = url.pathname.split('/');
        filename = pathnameParts.pop() || filename;
    } catch (e) {
        // Если URL некорректный, оставляем имя по умолчанию
    }

    // Создаем запись-плейсхолдер в базе данных
    const newNode = await prisma.storageNode.create({
        data: {
            type: NodeType.FILE,
            name: filename,
            status: NodeStatus.PENDING, // Статус "В очереди"
            ownerId: user.userId,
            parentId,
            meta: { sourceUrl } // Сохраняем исходный URL в метаданные
        },
    });

    // Добавляем задачу в очередь BullMQ
    await addDownloadUrlJob({
        nodeUuid: newNode.uuid,
        sourceUrl: sourceUrl,
    });

    setResponseStatus(event, 202); // 202 Accepted - Запрос принят, но обработка не завершена
    return {
        ...newNode,
        sizeBytes: null
    };
});