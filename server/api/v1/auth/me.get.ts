
import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
    const userId = event.context.user?.userId

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, username: true, role: true },
    })

    if (!user) {
        
        throw createError({ statusCode: 404, message: 'Пользователь не найден' })
    }

    return user
})