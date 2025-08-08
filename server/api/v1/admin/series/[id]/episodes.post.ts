import prisma from '~/server/utils/prisma'
import { Prisma } from '@prisma/client'

export default defineEventHandler(async (event) => {
    const seriesId = parseInt(event.context.params?.id ?? '', 10)
    // Извлекаем данные из тела запроса
    const {
        seasonNumber,
        episodeNumber,
        title,
        externalIds
    } = await readBody(event)

    // Базовая валидация входных данных
    if (isNaN(seriesId) || !seasonNumber || !episodeNumber) {
        throw createError({ statusCode: 400, message: 'Некорректные данные сезона или эпизода' })
    }

    // Ищем или создаем сезон.
    // Если сезон с таким номером для этого сериала уже есть, используем его.
    // Если нет, создаем новый.
    const season = await prisma.season.upsert({
        where: { seriesId_seasonNumber: { seriesId, seasonNumber } },
        update: {}, // Если запись существует, ничего не обновляем
        create: {
            seriesId,
            seasonNumber,
        },
    })

    // Создаем новый эпизод, привязывая его к найденному/созданному сезону
    const newEpisode = await prisma.episode.create({
        data: {
            seasonId: season.id,
            episodeNumber,
            title: title || `Эпизод ${episodeNumber}`, // Если название не указано, генерируем
            // Сохраняем externalIds как JSONB. Если пусто, то пустой объект.
            externalIds: (externalIds || {}) as Prisma.JsonObject,
        },
    })

    // ★ НОВОЕ: Обновление "копилки" externalIds у сериала (агрегация всех ID)
    if (externalIds && Object.keys(externalIds).length > 0) {
        const series = await prisma.series.findUnique({ where: { id: seriesId } })
        if (series) {
            // Получаем текущие externalIds сериала, инициализируем как пустой объект, если null
            const seriesExternalIds = (series.externalIds || {}) as Record<string, string[]>

            // Проходимся по новым externalIds эпизода
            for (const [key, value] of Object.entries(externalIds)) {
                if (typeof value === 'string' && value) { // Убеждаемся, что это не пустая строка
                    if (!seriesExternalIds[key]) {
                        seriesExternalIds[key] = [] // Создаем массив, если его нет
                    }
                    if (!seriesExternalIds[key].includes(value)) {
                        seriesExternalIds[key].push(value) // Добавляем, если ID еще нет в списке
                    }
                }
            }
            // Обновляем сериал в БД
            await prisma.series.update({
                where: { id: seriesId },
                data: { externalIds: seriesExternalIds as Prisma.JsonObject },
            })
        }
    }

    setResponseStatus(event, 201) // 201 Created
    return newEpisode
})