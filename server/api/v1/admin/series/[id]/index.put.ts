// server/api/v1/admin/series/[id]/index.put.ts
import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
    const seriesId = parseInt(event.context.params?.id ?? '', 10)
    if (isNaN(seriesId)) {
        throw createError({ statusCode: 400, message: 'Неверный ID сериала' })
    }

    const { title, posterUrl } = await readBody(event)
    if (!title) {
        throw createError({ statusCode: 400, message: 'Название обязательно' })
    }

    const updatedSeries = await prisma.series.update({
        where: { id: seriesId },
        data: { title, posterUrl },
    })

    return updatedSeries
})