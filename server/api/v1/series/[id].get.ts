import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const seriesId = parseInt(event.context.params?.id ?? '', 10)
  if (isNaN(seriesId)) {
    throw createError({ statusCode: 400, message: 'Неверный ID сериала' })
  }

  const series = await prisma.series.findUnique({
    where: { id: seriesId },
    include: {
      seasons: {
        orderBy: { seasonNumber: 'asc' },
        include: {
          episodes: {
            orderBy: { episodeNumber: 'asc' },
            select: {
              id: true,
              episodeNumber: true,
              title: true,
              externalIds: true,
            },
          },
        },
      },
    },
  })

  if (!series) {
    throw createError({ statusCode: 404, message: 'Сериал не найден' })
  }
  return series
})