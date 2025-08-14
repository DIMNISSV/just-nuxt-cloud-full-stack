

import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
    const compositionId = parseInt(event.context.params?.id ?? '', 10)
    if (isNaN(compositionId)) {
        throw createError({ statusCode: 400, message: 'Неверный ID сборки' })
    }

    const {
        videoStreamId: videoStreamId,
        audioStreamId: audioStreamId,
        translatorId: translatorId,
        audioOffsetMs: audioOffsetMs
    } = await readBody(event)
    if (!videoStreamId || !audioStreamId || !translatorId) {
        throw createError({ statusCode: 400, message: 'Не все обязательные поля заполнены' })
    }

    
    

    const translator = await prisma.translator.findUnique({ where: { id: translatorId } })
    if (!translator) {
        throw createError({ statusCode: 404, message: 'Переводчик не найден' })
    }

    
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