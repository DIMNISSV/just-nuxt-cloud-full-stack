import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user) {
        throw createError({ statusCode: 401, message: 'Требуется авторизация' });
    }

    const nodeId = parseInt(event.context.params?.id ?? '', 10);
    if (isNaN(nodeId)) {
        throw createError({ statusCode: 400, message: 'Некорректный ID узла' });
    }

    const { name } = await readBody(event);
    if (!name) {
        throw createError({ statusCode: 400, message: 'Имя не может быть пустым' });
    }

    const nodeToRename = await prisma.storageNode.findUnique({ where: { id: nodeId, ownerId: user.userId } });
    if (!nodeToRename) {
        throw createError({ statusCode: 404, message: 'Узел не найден или у вас нет прав на его изменение' });
    }

    // ★ ИСПРАВЛЕНИЕ: Используем findFirst и строим корректный `where` для проверки конфликта
    const conflictingNode = await prisma.storageNode.findFirst({
        where: {
            ownerId: user.userId,
            parentId: nodeToRename.parentId, // Корректно подставит null или ID
            name: name,
            // Исключаем из проверки сам узел, который переименовываем
            NOT: {
                id: nodeId
            }
        }
    });

    if (conflictingNode) {
        throw createError({ statusCode: 409, message: `Объект с именем "${name}" уже существует в этой папке.` });
    }

    const updatedNode = await prisma.storageNode.update({
        where: { id: nodeId },
        data: { name },
    });

    return {
        ...updatedNode,
        sizeBytes: updatedNode.sizeBytes ? Number(updatedNode.sizeBytes) : null
    };
});