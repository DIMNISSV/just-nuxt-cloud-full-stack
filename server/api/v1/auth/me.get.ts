import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
    // Данные о пользователе (id, role) будут добавлены в контекст middleware
    const userContext = event.context.user

    if (!userContext) {
        throw createError({ statusCode: 401, message: 'Необходима авторизация' })
    }

    const user = await prisma.user.findUnique({
        where: { id: userContext.userId },
        select: { id: true, username: true, role: true }, // Возвращаем только публичные данные
    })

    if (!user) {
        throw createError({ statusCode: 404, message: 'Пользователь не найден' })
    }

    return user
})