import prisma from '~/server/utils/prisma'
import { deleteObject } from '~/server/utils/s3'

export default defineEventHandler(async (event) => {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, message: 'Требуется авторизация' })

    const assetId = parseInt(event.context.params!.id, 10)
    if (isNaN(assetId)) throw createError({ statusCode: 400, message: 'Неверный ID' })

    // 1. Сначала находим ассет, чтобы получить его s3Key и проверить права
    const assetToDelete = await prisma.fileAsset.findUnique({
        where: { id: assetId },
    })

    if (!assetToDelete) {
        // Если ассета и так нет, просто возвращаем успешный ответ
        return setResponseStatus(event, 204)
    }

    // Проверяем, что пользователь удаляет свой собственный ассет
    if (assetToDelete.userId !== user.userId) {
        throw createError({ statusCode: 403, message: 'Доступ запрещен' })
    }

    // 2. Удаляем файл из S3
    await deleteObject(assetToDelete.s3Key)

    // 3. Удаляем запись из базы данных.
    // onDelete: Cascade в схеме позаботится об удалении связанной PersonalFileMeta
    await prisma.fileAsset.delete({
        where: { id: assetId },
    })

    setResponseStatus(event, 204)
})