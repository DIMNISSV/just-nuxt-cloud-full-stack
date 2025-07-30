// server/api/v1/account/compositions/index.post.ts

import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  // Права на создание сборок может иметь любой авторизованный пользователь
  const {
    episodeId,
    video_stream_id: videoStreamId,
    audio_stream_id: audioStreamId,
    translator_id: translatorId,
    audio_offset_ms: audioOffsetMs
  } = await readBody(event)

  // Валидация входных данных
  if (!episodeId || !videoStreamId || !audioStreamId || !translatorId) {
    throw createError({ statusCode: 400, message: 'Не все обязательные поля заполнены' })
  }

  // Проверка на конфликт: нельзя добавить одну и ту же аудиодорожку дважды к одному эпизоду
  const conflictingComposition = await prisma.composition.findFirst({
    where: {
      episodeId,
      audioStreamId,
    },
  })

  if (conflictingComposition) {
    throw createError({ statusCode: 409, message: 'Этот аудиопоток уже используется в другой сборке для этого эпизода.' })
  }

  // Получаем имя переводчика для денормализации в поле `name` композиции
  const translator = await prisma.translator.findUnique({ where: { id: translatorId } })
  if (!translator) {
    throw createError({ statusCode: 404, message: 'Переводчик не найден' })
  }

  // Создаем новую запись
  const newComposition = await prisma.composition.create({
    data: {
      name: translator.name,
      episodeId,
      videoStreamId,
      audioStreamId,
      translatorId,
      audioOffsetMs: audioOffsetMs || 0,
    },
  })

  setResponseStatus(event, 201) // Created
  return newComposition
})