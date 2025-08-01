// server/api/v1/storage/nodes/request-upload-url.post.ts

import prisma from '~/server/utils/prisma'
import { generateUploadUrl } from '~/server/utils/s3'
import { NodeType, NodeStatus } from '@prisma/client'

interface RequestUploadPayload {
    filename: string;
    sizeBytes: number;
    mimeType: string;
    parentId: number | 'root' | null;
}

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user) {
        throw createError({ statusCode: 401, message: 'Требуется авторизация' });
    }

    const body = await readBody<RequestUploadPayload>(event);

    if (!body.filename || !body.sizeBytes || !body.mimeType) {
        throw createError({ statusCode: 400, message: 'Не все обязательные поля заполнены: filename, sizeBytes, mimeType' });
    }

    // 1. Генерируем pre-signed URL и временный ключ в S3
    const { uploadUrl, s3Key } = await generateUploadUrl(body.filename, body.mimeType);

    // 2. Создаем запись StorageNode в базе данных
    const newNode = await prisma.storageNode.create({
        data: {
            type: NodeType.FILE,
            name: body.filename,
            s3Key: s3Key, // Временно храним временный ключ
            sizeBytes: body.sizeBytes,
            mimeType: body.mimeType,
            status: NodeStatus.PENDING,
            ownerId: user.userId,
            parentId: body.parentId === 'root' ? null : body.parentId,
        },
    });

    // 3. Возвращаем URL и ID узла клиенту
    return {
        nodeId: newNode.id,
        uploadUrl: uploadUrl,
    };
});