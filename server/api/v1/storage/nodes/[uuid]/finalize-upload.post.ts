import prisma from '~/server/utils/prisma'
import { objectExists, moveObject } from '~/server/utils/s3'
import { NodeStatus } from '@prisma/client'

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user) {
        throw createError({ statusCode: 401, message: 'Требуется авторизация' });
    }

    const uuid = event.context.params!.uuid;
    if (!uuid) {
        throw createError({ statusCode: 400, message: 'Некорректный UUID узла' });
    }

    const node = await prisma.storageNode.findUnique({ where: { uuid } });

    if (!node || node.ownerId !== user.userId) {
        throw createError({ statusCode: 404, message: 'Целевой узел для финализации не найден.' });
    }
    if (node.status !== NodeStatus.PENDING) {
        throw createError({
            statusCode: 409,
            message: `Неверный статус узла: ${node.status}. Ожидался PENDING.`
        });
    }

    const tempS3Key = node.s3Key;
    if (!tempS3Key) {
        await prisma.storageNode.delete({ where: { id: node.id } });
        throw createError({ statusCode: 500, message: 'Критическая ошибка: у узла отсутствует временный ключ S3. Запись была удалена.' });
    }

    const isUploaded = await objectExists(tempS3Key);
    if (!isUploaded) {
        await prisma.storageNode.delete({ where: { id: node.id } });
        throw createError({ statusCode: 400, message: 'Файл не был загружен в хранилище. Попробуйте снова.' });
    }

    const permanentS3Key = `drive/${user.userId}/${node.uuid}`;

    await moveObject(tempS3Key, permanentS3Key);

    const updatedNode = await prisma.storageNode.update({
        where: { id: node.id },
        data: { s3Key: permanentS3Key, status: NodeStatus.AVAILABLE },
    });

    return { ...updatedNode, sizeBytes: Number(updatedNode.sizeBytes) };
});