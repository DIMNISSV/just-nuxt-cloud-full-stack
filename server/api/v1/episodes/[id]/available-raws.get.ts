// server/api/v1/episodes/[id]/available-raws.get.ts
import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
    const episodeId = parseInt(event.context.params?.id ?? '', 10)
    if (isNaN(episodeId)) {
        throw createError({ statusCode: 400, message: 'Неверный ID эпизода' })
    }

    // Находим все загрузки, привязанные к этому эпизоду
    const uploads = await prisma.upload.findMany({
        where: { linkedEpisodeId: episodeId },
        include: { mediaStreams: true },
    })

    // Собираем все видеопотоки из этих загрузок
    const videoStreamsFromUploads = uploads.flatMap(u => u.mediaStreams.filter(s => s.type === 'VIDEO'))

    // Находим все видеопотоки, уже использующиеся в сборках для этого эпизода
    const compositions = await prisma.composition.findMany({
        where: { episodeId },
        include: { videoStream: true }
    })
    const videoStreamsFromComps = compositions.map(c => c.videoStream);

    // Объединяем и убираем дубликаты
    const allStreams = [...videoStreamsFromUploads, ...videoStreamsFromComps]
    const uniqueStreams = Array.from(new Map(allStreams.map(s => [s.id, s])).values())

    // Возвращаем только нужные поля
    return uniqueStreams.map(s => ({
        id: s.id,
        title: s.title,
        // В реальном приложении здесь нужно было бы получить username через еще один include
        uploader_username: 'user'
    }));
})