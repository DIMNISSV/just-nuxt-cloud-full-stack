// server/api/v1/assets/download-from-url.post.ts

import prisma from '~/server/utils/prisma'
import { addDownloadUrlJob } from '~/server/utils/queue'
import type { AssetType } from '@prisma/client'
// ★ ИЗМЕНЕНИЕ: Импортируем uuid для генерации уникального плейсхолдера
import { v4 as uuidv4 } from 'uuid'

interface DownloadFromUrlPayload {
    sourceUrl: string;
    assetType: AssetType;
    folderId?: number;
}

export default defineEventHandler(async (event) => {
    const user = event.context.user
    if (!user) {
        throw createError({ statusCode: 401, message: 'Требуется авторизация' })
    }

    const body = await readBody<DownloadFromUrlPayload>(event)
    if (!body.sourceUrl || !body.assetType) {
        throw createError({ statusCode: 400, message: 'Необходимы sourceUrl и assetType' })
    }

    const originalFilename = body.sourceUrl.split('/').pop()?.split('?')[0] || 'downloaded_file'

    // ★ ИЗМЕНЕНИЕ: Генерируем уникальный временный ключ вместо пустой строки
    const tempS3Key = `pending-url-download/${uuidv4()}`

    const newAsset = await prisma.fileAsset.create({
        data: {
            originalFilename,
            s3Key: tempS3Key, // ★ ИЗМЕНЕНИЕ: Используем уникальный плейсхолдер
            sizeBytes: 0,
            mimeType: 'application/octet-stream',
            status: 'PENDING',
            assetType: body.assetType,
            userId: user.userId,

            ...(body.assetType === 'PERSONAL' && {
                personalFileMeta: {
                    create: {
                        folderId: body.folderId || null,
                    },
                },
            }),
            ...(body.assetType === 'MEDIA_SOURCE' && {
                mediaFileMeta: {
                    create: {},
                },
            }),
        },
    })

    await addDownloadUrlJob({
        assetId: newAsset.id,
        sourceUrl: body.sourceUrl,
    })

    return {
        assetId: newAsset.id,
        message: 'Загрузка по URL поставлена в очередь.',
    }
})