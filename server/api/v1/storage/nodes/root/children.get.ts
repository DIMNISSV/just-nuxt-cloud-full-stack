

import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
    const user = event.context.user
    if (!user) {
        throw createError({ statusCode: 401, message: 'Требуется авторизация' })
    }

    const nodesRaw = await prisma.storageNode.findMany({
        where: {
            ownerId: user.userId,
            parentId: null, 
        },
        orderBy: [{ type: 'asc' }, { name: 'asc' }],
    })

    const nodes = nodesRaw.map(node => ({
        ...node,
        sizeBytes: node.sizeBytes ? Number(node.sizeBytes) : null
    }));

    return { nodes, breadcrumbs: [] }; 
});