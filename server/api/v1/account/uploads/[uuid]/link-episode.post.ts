// server/api/v1/account/uploads/[uuid]/link-episode.post.ts
import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const { userId } = event.context.user!
  const uuid = event.context.params?.uuid
  const { episodeId } = await readBody(event)

  if (!uuid || !episodeId) {
    throw createError({ statusCode: 400, message: 'UUID и Episode ID обязательны' })
  }

  // Обновляем запись, только если она принадлежит текущему пользователю
  const result = await prisma.upload.updateMany({
    where: { uuid, userId },
    data: { linkedEpisodeId: episodeId },
  })
  
  if (result.count === 0) {
      throw createError({ statusCode: 404, message: 'Загрузка не найдена или у вас нет прав на ее изменение' })
  }

  return { message: 'Загрузка успешно привязана к эпизоду.' }
})