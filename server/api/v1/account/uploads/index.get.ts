// server/api/v1/account/uploads/index.get.ts
import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
    // Middleware /account/_ уже проверил авторизацию и добавил user в контекст
    console.log(event.context)
    const { userId } = event.context.user!

    const uploads = await prisma.upload.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
    })
    return uploads
})