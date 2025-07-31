import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, message: 'Требуется авторизация' })

    const { name, parentId } = await readBody(event)

    if (!name) throw createError({ statusCode: 400, message: 'Имя папки обязательно' })

    const newFolder = await prisma.personalFolder.create({
        data: {
            name,
            parentId: parentId === 'root' ? null : parentId,
            userId: user.userId,
        },
    })

    return newFolder
})