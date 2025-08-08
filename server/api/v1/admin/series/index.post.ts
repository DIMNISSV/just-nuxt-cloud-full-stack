// server/api/v1/admin/series/index.post.ts
import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
    // Middleware /admin/_ уже проверил права администратора
    const { title, posterUrl } = await readBody(event)
    if (!title) {
        throw createError({ statusCode: 400, message: 'Название сериала обязательно' })
    }

    const newSeries = await prisma.series.create({
        data: {
            title,
            // Если URL постера не указан, ставим заглушку
            posterUrl: posterUrl || 'https://placehold.co/400x600/cccccc/e2e8f0?text=No+Image',
        },
    })
    setResponseStatus(event, 201) // 201 Created
    return newSeries
})