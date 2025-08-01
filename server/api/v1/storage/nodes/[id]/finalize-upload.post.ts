// server/api/v1/storage/nodes/[id]/finalize-upload.post.ts

import prisma from '~/server/utils/prisma'
import { objectExists, moveObject } from '~/server/utils/s3'
import { NodeStatus } from '@prisma/client'

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user) {
        throw createError({ statusCode: 401, message: 'Требуется авторизация' });
    }

    const nodeId = parseInt(event.context.params!.id, 10);
    if (isNaN(nodeId)) {
        throw createError({ statusCode: 400, message: 'Некорректный ID узла' });
    }

    const node = await prisma.storageNode.findUnique({
        where: { id: nodeId },
    });

    if (!node) {
        throw createError({ statusCode: 404, message: 'Узел не найден' });
    }
    if (node.ownerId !== user.userId) {
        throw createError({ statusCode: 403, message: 'Доступ запрещен' });
    }
    if (node.status !== NodeStatus.PENDING) {
        throw createError({ statusCode: 409, message: `Неверный статус узла: ${node.status}. Ожидался PENDING.` });
    }

    const tempS3Key = node.s3Key;
    if (!tempS3Key) {
        throw createError({ statusCode: 500, message: 'У узла отсутствует временный ключ S3' });
    }

    // 1. Проверяем, что файл действительно был загружен
    const isUploaded = await objectExists(tempS3Key);
    if (!isUploaded) {
        await prisma.storageNode.delete({ where: { id: nodeId } });
        throw createError({ statusCode: 400, message: 'Файл не был загружен в S3. Запись удалена.' });
    }

    // 2. Генерируем постоянный ключ и перемещаем объект
    const permanentS3Key = `drive/${user.userId}/${node.uuid}/${node.name}`;
    await moveObject(tempS3Key, permanentS3Key);

    // 3. Обновляем узел в базе данных
    const updatedNode = await prisma.storageNode.update({
        where: { id: nodeId },
        data: {
            s3Key: permanentS3Key,
            status: NodeStatus.AVAILABLE, // Файл сразу доступен
        },
    });

    console.log(`Узел #${nodeId} успешно финализирован. Новый статус: AVAILABLE`);

    return {
        ...updatedNode,
        sizeBytes: Number(updatedNode.sizeBytes)
    };
});