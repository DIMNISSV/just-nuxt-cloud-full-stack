import prisma from '~/server/utils/prisma'
import { Prisma } from '@prisma/client'

export default defineEventHandler(async (event) => {
  const episodeId = parseInt(event.context.params?.id ?? '', 10)
  if (isNaN(episodeId)) throw createError({ statusCode: 400, message: 'Неверный ID' })

  const { title, externalIds } = await readBody(event)

  const updatedEpisode = await prisma.episode.update({
    where: { id: episodeId },
    data: {
      title,
      externalIds: (externalIds || {}) as Prisma.JsonObject,
    },
    include: {
      season: true, // Включаем сезон, чтобы узнать ID родительского сериала
    },
  })

  if (!updatedEpisode) {
    throw createError({ statusCode: 404, message: 'Эпизод не найден' })
  }

  // Обновление "копилки" externalIds у сериала
  const seriesId = updatedEpisode.season.seriesId
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

  // Возвращаем только данные эпизода, без сезона
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { season, ...result } = updatedEpisode
  return result
})