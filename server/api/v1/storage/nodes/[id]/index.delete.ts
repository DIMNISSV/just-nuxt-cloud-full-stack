// server/api/v1/storage/nodes/[id]/index.delete.ts

import prisma from '~/server/utils/prisma'
import { deleteMultipleObjects } from '~/server/utils/s3'
import type { StorageNode } from '@prisma/client'

export default defineEventHandler(async (event) => {
    const user = event.context.user
    if (!user) {
        throw createError({ statusCode: 401, message: 'Требуется авторизация' })
    }

    const nodeId = parseInt(event.context.params?.id ?? '', 10)
    if (isNaN(nodeId)) {
        throw createError({ statusCode: 400, message: 'Некорректный ID узла' })
    }

    const node = await prisma.storageNode.findUnique({ where: { id: nodeId, ownerId: user.userId } })
    if (!node) {
        throw createError({ statusCode: 404, message: 'Узел не найден или у вас нет прав на его удаление' })
    }

    const nodeIdsToDelete: number[] = []
    const s3KeysToDelete: string[] = []

    // Рекурсивная функция для сбора всех вложенных узлов и их S3 ключей
    async function collectNodesToDelete(currentId: number) {
        const currentNode = await prisma.storageNode.findUnique({
            where: { id: currentId },
            include: { children: true }
        });

        if (!currentNode) return;

        nodeIdsToDelete.push(currentNode.id);
        if (currentNode.s3Key) {
            s3KeysToDelete.push(currentNode.s3Key);
        }

        for (const child of currentNode.children) {
            await collectNodesToDelete(child.id);
        }
    }

    await collectNodesToDelete(nodeId);

    // 1. Массовое удаление всех узлов из базы данных
    if (nodeIdsToDelete.length > 0) {
        await prisma.storageNode.deleteMany({
            where: { id: { in: nodeIdsToDelete } },
        })
    }

    // 2. Массовое удаление всех связанных файлов из S3
    if (s3KeysToDelete.length > 0) {
        await deleteMultipleObjects(s3KeysToDelete)
    }

    console.log(`[DELETE] Пользователь #${user.userId} удалил узел #${nodeId} и ${nodeIdsToDelete.length - 1} вложенных узлов.`);

    setResponseStatus(event, 204) // No Content
})