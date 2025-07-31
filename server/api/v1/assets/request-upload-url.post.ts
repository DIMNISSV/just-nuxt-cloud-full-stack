import prisma from '~/server/utils/prisma'
import { generateUploadUrl } from '~/server/utils/s3'
import type { RequestUploadPayload } from '~/types'
import { AssetType } from '@prisma/client'

export default defineEventHandler(async (event) => {
    // Middleware уже должен был проверить авторизацию и добавить user в контекст
    const user = event.context.user
    if (!user) {
        throw createError({ statusCode: 401, message: 'Требуется авторизация' })
    }

    const body = await readBody<RequestUploadPayload>(event)

    // Валидация входных данных
    if (!body.filename || !body.sizeBytes || !body.mimeType || !body.assetType) {
        throw createError({ statusCode: 400, message: 'Не все обязательные поля заполнены: filename, sizeBytes, mimeType, assetType' })
    }
    if (!Object.values(AssetType).includes(body.assetType)) {
        throw createError({ statusCode: 400, message: 'Некорректный assetType' })
    }

    // 1. Генерируем pre-signed URL и временный ключ в S3
    const { uploadUrl, s3Key } = await generateUploadUrl(body.filename, body.mimeType)

    // 2. Создаем запись FileAsset и связанную мета-запись в одной транзакции
    const newAsset = await prisma.fileAsset.create({
        data: {
            originalFilename: body.filename,
            s3Key: s3Key, // Временно храним временный ключ
            sizeBytes: body.sizeBytes,
            mimeType: body.mimeType,
            assetType: body.assetType,
            status: 'PENDING',
            userId: user.userId,

            // Вложенное создание мета-записи
            ...(body.assetType === AssetType.PERSONAL && {
                personalFileMeta: {
                    create: {
                        folderId: body.folderId || null,
                    },
                },
            }),
            ...(body.assetType === AssetType.MEDIA_SOURCE && {
                mediaFileMeta: {
                    create: {},
                },
            }),
        },
    })

    // 3. Возвращаем URL и ID ассета клиенту
    return {
        assetId: newAsset.id,
        uploadUrl: uploadUrl,
    }
})