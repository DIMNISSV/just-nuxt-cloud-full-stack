// server/api/v1/uploads/[uuid]/index.get.ts

import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const uuid = event.context.params?.uuid
  if (!uuid) {
    throw createError({ statusCode: 400, message: 'UUID is required' })
  }

  const query = getQuery(event)
  const episodeId = query.episodeId ? parseInt(query.episodeId as string, 10) : null

  // Ищем загрузку по уникальному UUID
  const upload = await prisma.upload.findUnique({
    where: { uuid },
    include: {
      // Включаем связанные с этой загрузкой медиапотоки
      mediaStreams: {
        orderBy: { type: 'asc' }, // Сортируем (видео, потом аудио, потом сабы)
      },
    },
  })

  if (!upload) {
    throw createError({ statusCode: 404, message: 'Загрузка не найдена' })
  }

  let existingCompositions: any[] = []
  // Если в запросе был передан episodeId, ищем существующие сборки для него
  if (episodeId && !isNaN(episodeId)) {
    existingCompositions = await prisma.composition.findMany({
      where: { episodeId },
      include: {
        translator: { select: { name: true } }, // Подгружаем имя переводчика для отображения
      },
    })
  }

  // Возвращаем объект с данными о загрузке и связанных сборках
  return {
    upload,
    existingCompositions,
  }
})