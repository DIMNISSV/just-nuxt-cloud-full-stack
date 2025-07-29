import prisma from '~/server/utils/prisma'
import { Prisma } from '@prisma/client'

export default defineEventHandler(async (event) => {
    const seriesId = parseInt(event.context.params?.id ?? '', 10)
    const { seasonNumber, episodeNumber, title, externalIds } = await readBody(event)

    // Валидация...
    if (isNaN(seriesId) || !seasonNumber || !episodeNumber) {
        throw createError({ statusCode: 400, message: 'Некорректные данные' })
    }

    // Используем upsert для создания сезона, если его еще нет
    const season = await prisma.season.upsert({
        where: { seriesId_seasonNumber: { seriesId, seasonNumber } },
        update: {},
        create: {
            seriesId,
            seasonNumber,
        },
    })

    const newEpisode = await prisma.episode.create({
        data: {
            seasonId: season.id,
            episodeNumber,
            title: title || `Эпизод ${episodeNumber}`,
            externalIds: (externalIds || {}) as Prisma.JsonObject,
        },
    })

    // Обновление "копилки" externalIds у сериала
    if (externalIds && Object.keys(externalIds).length > 0) {
        const series = await prisma.series.findUnique({ where: { id: seriesId } })
        if (series) {
            const seriesExternalIds = (series.externalIds || {}) as Record<string, string[]>

            for (const [key, value] of Object.entries(externalIds)) {
                if (typeof value === 'string' && value) {
                    if (!seriesExternalIds[key]) {
                        seriesExternalIds[key] = []
                    }
                    if (!seriesExternalIds[key].includes(value)) {
                        seriesExternalIds[key].push(value)
                    }
                }
            }

            await prisma.series.update({
                where: { id: seriesId },
                data: { externalIds: seriesExternalIds as Prisma.JsonObject },
            })
        }
    }

    setResponseStatus(event, 201)
    return newEpisode
})