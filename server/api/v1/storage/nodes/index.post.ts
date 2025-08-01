// server/api/v1/storage/nodes/index.post.ts

import prisma from '~/server/utils/prisma'
import { NodeType } from '@prisma/client'

// Определяем, что может прийти в теле запроса
interface CreateNodePayload {
    type: NodeType;
    name: string;
    parentId?: number | 'root' | null;
}

export default defineEventHandler(async (event) => {
    const user = event.context.user
    if (!user) {
        throw createError({ statusCode: 401, message: 'Требуется авторизация' })
    }

    const { type, name, parentId: parentIdRaw } = await readBody<CreateNodePayload>(event)

    if (!type || !name) {
        throw createError({ statusCode: 400, message: 'Необходимо указать тип и имя узла' })
    }

    const parentId = parentIdRaw === 'root' || !parentIdRaw ? null : parentIdRaw;

    // Пока реализуем только создание папок
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
    })

    return {
        ...newFolder,
        sizeBytes: null // Явно указываем null для консистентности
    }
})