

import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
    const user = event.context.user
    if (!user) {
        throw createError({ statusCode: 401, message: 'Требуется авторизация' })
    }

    const parentUuid = event.context.params?.uuid
    if (!parentUuid) {
        throw createError({ statusCode: 400, message: 'Некорректный UUID родительской папки' })
    }

    const parentNode = await prisma.storageNode.findUnique({
        where: { uuid: parentUuid, ownerId: user.userId }
    });
    if (!parentNode) {
        throw createError({ statusCode: 404, message: 'Папка не найдена' });
    }

    const nodesRaw = await prisma.storageNode.findMany({
        where: { ownerId: user.userId, parentId: parentNode.id },
        orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });

    const nodes = nodesRaw.map(node => ({ ...node, sizeBytes: node.sizeBytes ? Number(node.sizeBytes) : null }));

    const breadcrumbs = [];
    let currentId = parentNode.parentId;
    while (currentId !== null) {
        const parent = await prisma.storageNode.findUnique({
            where: { id: currentId, ownerId: user.userId },
            select: { uuid: true, name: true, parentId: true },
        });
        if (!parent) break;
        breadcrumbs.unshift({ uuid: parent.uuid, name: parent.name });
        currentId = parent.parentId;
    }
    
    breadcrumbs.push({ uuid: parentNode.uuid, name: parentNode.name });


    return { nodes, breadcrumbs };
});