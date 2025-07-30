// server/api/v1/player/episodes/[id]/translations.get.ts

import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const episodeId = parseInt(event.context.params?.id ?? '', 10)
  if (isNaN(episodeId)) {
    throw createError({ statusCode: 400, message: 'Неверный ID эпизода' })
  }

  // Находим все сборки (композиции) для данного эпизода
  const compositions = await prisma.composition.findMany({
    where: { episodeId },
    // Включаем связанные видео и аудио потоки, чтобы получить их пути
    include: {
      videoStream: { select: { filePath: true } },
      audioStream: { select: { filePath: true, title: true } },
    },
  })

  // Формируем `player_config` на лету для каждой сборки
  // В реальном приложении этот конфиг мог бы храниться в БД, но так гибче
  return compositions.map(comp => ({
    id: comp.id,
    name: comp.name,
    audioStreamId: comp.audioStreamId, // Отправляем ID для UI
    videoStreamId: comp.videoStreamId, // Отправляем ID для UI
    player_config: {
      // TODO: В будущем здесь нужно формировать полные URL из ключей S3
      video: comp.videoStream.filePath,
      audio: [{ title: comp.audioStream.title ?? 'Audio', src: comp.audioStream.filePath }],
      // Логику субтитров можно будет добавить здесь позже
      subtitles: [],
    },
  }))
})