// server/api/v1/account/uploads/index.post.ts
import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
    const { userId } = event.context.user!
    const { type, sources } = await readBody(event) as { type: string, sources: string[] }

    if (!type || !sources || !Array.isArray(sources) || sources.length === 0) {
        throw createError({ statusCode: 400, message: 'Неверный формат запроса' })
    }

    const newUploadsData = sources.map(source => ({
        type,
        source,
        originalFilename: source.split('/').pop() || source,
        userId,
    }))

    // Prisma умеет создавать много записей одним запросом
    await prisma.upload.createMany({
        data: newUploadsData,
    })

    // Мы не возвращаем созданные объекты, так как createMany не делает этого.
    // Фронтенд просто обновит список.
    setResponseStatus(event, 202) // Accepted
    return { message: 'Загрузки добавлены в очередь' }
})