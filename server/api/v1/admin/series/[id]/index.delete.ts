import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
    const seriesId = parseInt(event.context.params?.id ?? '', 10)
    if (isNaN(seriesId)) throw createError({ statusCode: 400, message: 'Неверный ID' })

    // Каскадное удаление, настроенное в Prisma, удалит все связанные сезоны и эпизоды
    await prisma.series.delete({
        where: { id: seriesId }
    })

    setResponseStatus(event, 204)
    return
})