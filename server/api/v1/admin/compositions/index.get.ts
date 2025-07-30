// server/api/v1/admin/compositions/index.get.ts
import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
    // Middleware /admin/_ уже проверил, что это администратор

    const compositions = await prisma.composition.findMany({
        orderBy: {
            createdAt: 'desc',
        },
        include: {
            // Включаем связанную информацию для отображения в админ-панели
            episode: {
                select: {
                    id: true,
                    title: true,
                    episodeNumber: true,
                    season: {
                        select: {
                            seasonNumber: true,
                            series: {
                                select: {
                                    id: true,
                                    title: true,
                                },
                            },
                        },
                    },
                },
            },
            translator: {
                select: {
                    name: true,
                },
            },
        },
    })

    return compositions
})