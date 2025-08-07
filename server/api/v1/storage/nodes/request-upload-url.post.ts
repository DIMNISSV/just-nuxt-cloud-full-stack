// server/api/v1/storage/nodes/request-upload-url.post.ts

import prisma from '~/server/utils/prisma'
import { generateUploadUrl } from '~/server/utils/s3'
import { NodeType, NodeStatus } from '@prisma/client'

interface RequestUploadPayload {
    filename: string;
    sizeBytes: number;
    mimeType: string;
    parentUuid: string | null;
}

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user) throw createError({ statusCode: 401, message: 'Требуется авторизация' });

    const body = await readBody<RequestUploadPayload>(event);
    if (!body.filename || body.sizeBytes === undefined || !body.mimeType) {
        throw createError({ statusCode: 400, message: 'Не все обязательные поля заполнены' });
    }

    let parentId: number | null = null;
    if (body.parentUuid) {
        const parentNode = await prisma.storageNode.findUnique({ where: { uuid: body.parentUuid, ownerId: user.userId } });
        if (!parentNode) {
            throw createError({ statusCode: 404, message: 'Родительская папка не найдена' });
        }
        parentId = parentNode.id;
    }

    // ★ ИСПРАВЛЕНИЕ: Проверка на конфликт имен ПЕРЕД созданием
    const conflictingNode = await prisma.storageNode.findFirst({
        where: {
            ownerId: user.userId,
            parentId: parentId,
            name: body.filename,
        }
    });

    if (conflictingNode) {
        throw createError({
            statusCode: 409,
            message: `Файл с именем "${body.filename}" уже существует в этой папке.`
        });
    }

    const { uploadUrl, s3Key } = await generateUploadUrl(body.filename, body.mimeType);

    const newNode = await prisma.storageNode.create({
        data: {
            type: NodeType.FILE,
            name: body.filename,
            s3Key,
            sizeBytes: body.sizeBytes,
            mimeType: body.mimeType,
            status: NodeStatus.PENDING,
            ownerId: user.userId,
            parentId,
        },
    });

    return {
        nodeUuid: newNode.uuid,
        uploadUrl,
    };
});