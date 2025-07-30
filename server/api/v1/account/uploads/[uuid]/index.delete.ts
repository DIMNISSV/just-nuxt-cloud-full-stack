// server/api/v1/account/uploads/[uuid]/index.delete.ts

import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
    const { userId } = event.context.user!
    const uuid = event.context.params?.uuid ?? ''
    if (!uuid) {
        throw createError({ statusCode: 400, message: 'UUID is required' })
    }

    // Удаляем запись, используя сложное условие `where`,
    // чтобы убедиться, что пользователь удаляет только свою загрузку.
    const result = await prisma.upload.deleteMany({
        where: {
            uuid,
            userId,
        },
    })

    // Если `result.count` равен 0, значит, запись с таким UUID не найдена
    // или она не принадлежит текущему пользователю.
    if (result.count === 0) {
        throw createError({ statusCode: 404, message: 'Загрузка не найдена или у вас нет прав на ее удаление' })
    }

    setResponseStatus(event, 204) // No Content
    return
})