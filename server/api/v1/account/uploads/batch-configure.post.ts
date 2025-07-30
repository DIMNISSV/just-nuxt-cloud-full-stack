// server/api/v1/account/uploads/batch-configure.post.ts

import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
    const { uploadIds, startEpisodeId, autoCreateEpisodes } = await readBody(event) as {
        uploadIds: number[],
        startEpisodeId: number | null,
        autoCreateEpisodes: boolean
    }

    if (!uploadIds || !Array.isArray(uploadIds)) {
        throw createError({ statusCode: 400, message: 'Необходимы ID загрузок' })
    }

    // --- Находим стартовую точку ---
    if (!startEpisodeId) {
        // В реальном приложении здесь была бы сложная логика поиска или создания сериала.
        // Для MVP предполагаем, что пользователь всегда выбирает существующий эпизод.
        throw createError({ statusCode: 400, message: 'Необходимо выбрать стартовый эпизод' })
    }

    const startEpisode = await prisma.episode.findUnique({
        where: { id: startEpisodeId },
        include: { season: true }
    })

    if (!startEpisode) {
        throw createError({ statusCode: 404, message: 'Стартовый эпизод не найден' })
    }

    const seriesId = startEpisode.season.seriesId
    const seasonId = startEpisode.season.id

    // --- Основная логика ---
    let configuredCount = 0
    for (const [index, uploadId] of uploadIds.entries()) {
        const upload = await prisma.upload.findUnique({
            where: { id: uploadId },
            include: { mediaStreams: true }
        })

        // Пропускаем уже привязанные загрузки
        if (!upload || upload.linkedEpisodeId) continue

        const currentEpisodeNumber = startEpisode.episodeNumber + index

        // Ищем или создаем эпизод
        let currentEpisode = await prisma.episode.findUnique({
            where: { seasonId_episodeNumber: { seasonId, episodeNumber: currentEpisodeNumber } }
        })

        if (!currentEpisode && autoCreateEpisodes) {
            currentEpisode = await prisma.episode.create({
                data: {
                    seasonId,
                    episodeNumber: currentEpisodeNumber,
                    title: `Эпизод ${currentEpisodeNumber}`,
                }
            })
        }

        if (!currentEpisode) break // Если эпизода нет и автосоздание выключено, прерываем цикл

        // 1. Привязываем upload к эпизоду
        await prisma.upload.update({
            where: { id: upload.id },
            data: { linkedEpisodeId: currentEpisode.id }
        })

        // 2. Пытаемся создать базовую сборку
        const audioStream = upload.mediaStreams.find(s => s.type === 'AUDIO')
        const videoStream = upload.mediaStreams.find(s => s.type === 'VIDEO')

        if (audioStream && videoStream) {
            // Для простоты, привязываем к первому попавшемуся переводчику
            const firstTranslator = await prisma.translator.findFirst()
            if (firstTranslator) {
                // Создаем сборку, только если ее еще нет
                await prisma.composition.createMany({
                    data: [{
                        name: firstTranslator.name,
                        episodeId: currentEpisode.id,
                        videoStreamId: videoStream.id,
                        audioStreamId: audioStream.id,
                        translatorId: firstTranslator.id
                    }],
                    skipDuplicates: true // Не вызовет ошибку, если такая сборка уже есть
                })
            }
        }
        configuredCount++;
    }

    return { message: `Успешно настроено ${configuredCount} из ${uploadIds.length} загрузок.` }
})