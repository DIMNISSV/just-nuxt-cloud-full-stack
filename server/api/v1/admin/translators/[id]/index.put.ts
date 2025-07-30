// server/api/v1/admin/translators/[id].put.ts
import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
    const id = parseInt(event.context.params?.id ?? '', 10)
    if (isNaN(id)) throw createError({ statusCode: 400, message: 'Неверный ID' })

    const { name } = await readBody(event)
    if (!name) throw createError({ statusCode: 400, message: 'Имя обязательно' })

    const updatedTranslator = await prisma.translator.update({
        where: { id },
        data: { name },
    })
    return updatedTranslator
})