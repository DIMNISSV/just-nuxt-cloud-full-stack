import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
    const episodeId = parseInt(event.context.params?.id ?? '', 10)
    if (isNaN(episodeId)) throw createError({ statusCode: 400, message: 'Неверный ID' })

    await prisma.episode.delete({ where: { id: episodeId } })
    setResponseStatus(event, 204)
    return
})