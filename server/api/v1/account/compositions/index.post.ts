

import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  
  const {
    episodeId,
    videoStreamId: videoStreamId,
    audioStreamId: audioStreamId,
    translatorId: translatorId,
    audioOffsetMs: audioOffsetMs
  } = await readBody(event)

  
  if (!episodeId || !videoStreamId || !audioStreamId || !translatorId) {
    throw createError({ statusCode: 400, message: 'Не все обязательные поля заполнены' })
  }

  
  const conflictingComposition = await prisma.composition.findFirst({
    where: {
      episodeId,
      audioStreamId,
    },
  })

  if (conflictingComposition) {
    throw createError({ statusCode: 409, message: 'Этот аудиопоток уже используется в другой сборке для этого эпизода.' })
  }

  
  const translator = await prisma.translator.findUnique({ where: { id: translatorId } })
  if (!translator) {
    throw createError({ statusCode: 404, message: 'Переводчик не найден' })
  }

  
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

  setResponseStatus(event, 201) 
  return newComposition
})