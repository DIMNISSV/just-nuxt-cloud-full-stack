// server/api/v1/account/compositions/[id]/index.put.ts

import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
    const compositionId = parseInt(event.context.params?.id ?? '', 10)
    if (isNaN(compositionId)) {
        throw createError({ statusCode: 400, message: 'Неверный ID сборки' })
    }

    const {
        video_stream_id: videoStreamId,
        audio_stream_id: audioStreamId,
        translator_id: translatorId,
        audio_offset_ms: audioOffsetMs
    } = await readBody(event)
    if (!videoStreamId || !audioStreamId || !translatorId) {
        throw createError({ statusCode: 400, message: 'Не все обязательные поля заполнены' })
    }

    // TODO: В будущем здесь нужна проверка, что пользователь имеет право редактировать эту сборку
    // (например, он является владельцем аудиодорожки). Пока для простоты ее опускаем.

    const translator = await prisma.translator.findUnique({ where: { id: translatorId } })
    if (!translator) {
        throw createError({ statusCode: 404, message: 'Переводчик не найден' })
    }

    // Обновляем запись
    const updatedComposition = await prisma.composition.update({
        where: { id: compositionId },
        data: {
            name: translator.name,
            videoStreamId,
            audioStreamId,
            translatorId,
            audioOffsetMs,
        },
    })

    return updatedComposition
})