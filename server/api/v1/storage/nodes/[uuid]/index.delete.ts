

import prisma from '~/server/utils/prisma'
import { deleteMultipleObjects } from '~/server/utils/s3'

export default defineEventHandler(async (event) => {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, message: 'Требуется авторизация' });

    const uuid = event.context.params?.uuid;
    if (!uuid) throw createError({ statusCode: 400, message: 'Некорректный UUID' });

    const node = await prisma.storageNode.findUnique({ where: { uuid, ownerId: user.userId } });
    if (!node) throw createError({ statusCode: 404, message: 'Узел не найден' });

    const nodeIdsToDelete: number[] = [];
    const s3KeysToDelete: string[] = [];

    async function collectNodesToDelete(currentId: number) {
        const currentNode = await prisma.storageNode.findUnique({
            where: { id: currentId },
            include: { children: true }
        });
        if (!currentNode) return;
        nodeIdsToDelete.push(currentNode.id);
        if (currentNode.s3Key) s3KeysToDelete.push(currentNode.s3Key);
        for (const child of currentNode.children) await collectNodesToDelete(child.id);
    }

    await collectNodesToDelete(node.id);

    if (nodeIdsToDelete.length > 0) await prisma.storageNode.deleteMany({ where: { id: { in: nodeIdsToDelete } } });
    if (s3KeysToDelete.length > 0) await deleteMultipleObjects(s3KeysToDelete);

    setResponseStatus(event, 204);
});