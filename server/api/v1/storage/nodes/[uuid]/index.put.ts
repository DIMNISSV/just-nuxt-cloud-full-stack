

import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user) throw createError({ statusCode: 401, message: 'Требуется авторизация' });

    const uuid = event.context.params?.uuid;
    if (!uuid) throw createError({ statusCode: 400, message: 'Некорректный UUID' });

    const { name } = await readBody(event);
    if (!name) throw createError({ statusCode: 400, message: 'Имя не может быть пустым' });

    const nodeToRename = await prisma.storageNode.findUnique({ where: { uuid, ownerId: user.userId } });
    if (!nodeToRename) throw createError({ statusCode: 404, message: 'Узел не найден' });

    const conflictingNode = await prisma.storageNode.findFirst({
        where: {
            ownerId: user.userId,
            parentId: nodeToRename.parentId,
            name: name,
            NOT: { uuid: uuid }
        }
    });
    if (conflictingNode) throw createError({ statusCode: 409, message: `Объект с именем "${name}" уже существует` });

    const updatedNode = await prisma.storageNode.update({
        where: { id: nodeToRename.id },
        data: { name },
    });

    return { ...updatedNode, sizeBytes: updatedNode.sizeBytes ? Number(updatedNode.sizeBytes) : null };
});