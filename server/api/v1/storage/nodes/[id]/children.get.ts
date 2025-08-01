// server/api/v1/storage/nodes/[id]/children.get.ts

import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
    const user = event.context.user
    if (!user) {
        throw createError({ statusCode: 401, message: 'Требуется авторизация' })
    }

    const parentIdParam = event.context.params?.id

    // 'root' - это специальное значение для корневой директории пользователя
    const parentId = parentIdParam === 'root' ? null : parseInt(parentIdParam ?? '', 10)

    if (isNaN(parentId as number) && parentId !== null) {
        throw createError({ statusCode: 400, message: 'Некорректный ID родительской папки' })
    }

    // Получаем дочерние узлы
    const nodesRaw = await prisma.storageNode.findMany({
        where: {
            ownerId: user.userId,
            parentId: parentId,
        },
        orderBy: [
            { type: 'asc' }, // Сначала папки, потом файлы
            { name: 'asc' },
        ],
    })

    // Преобразуем BigInt в number для безопасной передачи по JSON
    const nodes = nodesRaw.map(node => ({
        ...node,
        sizeBytes: node.sizeBytes ? Number(node.sizeBytes) : null
    }));

    // Собираем "хлебные крошки" для навигации
    const breadcrumbs = []
    let currentId = parentId
    while (currentId !== null) {
        const parent = await prisma.storageNode.findUnique({
            where: { id: currentId, ownerId: user.userId },
            select: { id: true, name: true, parentId: true },
        })
        if (!parent) break;
        breadcrumbs.unshift({ id: parent.id, name: parent.name })
        currentId = parent.parentId
    }

    return { nodes, breadcrumbs }
})