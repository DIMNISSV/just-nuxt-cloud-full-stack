// server/api/v1/storage/nodes/index.post.ts

import prisma from '~/server/utils/prisma'
import { NodeType } from '@prisma/client'

interface CreateNodePayload {
    type: NodeType;
    name: string;
    parentUuid?: string | null; // ★ ИЗМЕНЕНИЕ: Принимаем UUID родителя
}

export default defineEventHandler(async (event) => {
    const user = event.context.user
    if (!user) {
        throw createError({ statusCode: 401, message: 'Требуется авторизация' })
    }

    const { type, name, parentUuid } = await readBody<CreateNodePayload>(event)

    if (!type || !name) {
        throw createError({ statusCode: 400, message: 'Необходимо указать тип и имя узла' })
    }

    let parentId: number | null = null;
    if (parentUuid) {
        const parentNode = await prisma.storageNode.findUnique({ where: { uuid: parentUuid, ownerId: user.userId } });
        if (!parentNode) {
            throw createError({ statusCode: 404, message: 'Родительская папка не найдена' });
        }
        parentId = parentNode.id;
    }

    if (type !== NodeType.FOLDER) {
        throw createError({ statusCode: 501, message: 'Создание узлов этого типа пока не реализовано' })
    }

    const newFolder = await prisma.storageNode.create({
        data: {
            type: NodeType.FOLDER,
            name,
            parentId: parentId,
            ownerId: user.userId,
        },
    });

    setResponseStatus(event, 201);
    return {
        ...newFolder,
        sizeBytes: null
    };
});