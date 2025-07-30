// server/api/v1/admin/translators/[id].delete.ts
import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
    const id = parseInt(event.context.params?.id ?? '', 10)
    if (isNaN(id)) throw createError({ statusCode: 400, message: 'Неверный ID' })

    await prisma.translator.delete({ where: { id } })
    setResponseStatus(event, 204)
    return
})