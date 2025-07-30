// server/api/v1/admin/translators/index.post.ts
import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const { name } = await readBody(event)
  if (!name) {
    throw createError({ statusCode: 400, message: 'Имя переводчика обязательно' })
  }

  const newTranslator = await prisma.translator.create({
    data: { name },
  })
  setResponseStatus(event, 201)
  return newTranslator
})