import prisma from '~/server/utils/prisma'
import { addDownloadUrlJob } from '~/server/utils/queue'
import type { AssetType } from '@prisma/client'

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

    // Извлекаем предполагаемое имя файла из URL для первоначального создания
    const originalFilename = body.sourceUrl.split('/').pop()?.split('?')[0] || 'downloaded_file'

    // 1. Создаем запись FileAsset со статусом PENDING
    const newAsset = await prisma.fileAsset.create({
        data: {
            originalFilename,
            s3Key: '', // s3Key будет заполнен воркером
            sizeBytes: 0, // Размер также будет определен воркером
            mimeType: 'application/octet-stream', // MIME-тип будет уточнен воркером
            status: 'PENDING',
            assetType: body.assetType,
            userId: user.userId,

            // Создаем связанную мета-запись
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

    // 2. Ставим задачу в очередь на скачивание
    await addDownloadUrlJob({
        assetId: newAsset.id,
        sourceUrl: body.sourceUrl,
    })

    // 3. Возвращаем ID ассета для отслеживания
    return {
        assetId: newAsset.id,
        message: 'Загрузка по URL поставлена в очередь.',
    }
})