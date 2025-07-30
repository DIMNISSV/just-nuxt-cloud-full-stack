// server/api/v1/account/compositions/[id]/index.delete.ts

import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
    const compositionId = parseInt(event.context.params?.id ?? '', 10)
    if (isNaN(compositionId)) {
        throw createError({ statusCode: 400, message: 'Неверный ID сборки' })
    }

    // TODO: Проверка прав на удаление.

    try {
        await prisma.composition.delete({
            where: { id: compositionId },
        })
    } catch (e) {
        // Обрабатываем ошибку, если запись не найдена
        throw createError({ statusCode: 404, message: 'Сборка не найдена' })
    }

    setResponseStatus(event, 204) // No Content
    return
})