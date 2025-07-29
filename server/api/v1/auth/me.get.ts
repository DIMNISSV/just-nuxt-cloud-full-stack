// server/api/v1/auth/me.get.ts
import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
    const userId = event.context.user?.userId

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, username: true, role: true },
    })

    if (!user) {
        // Эта ошибка маловероятна, если токен валидный, но для полноты картины оставим
        throw createError({ statusCode: 404, message: 'Пользователь не найден' })
    }

    return user
})