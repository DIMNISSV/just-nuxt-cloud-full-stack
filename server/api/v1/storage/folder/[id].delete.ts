import prisma from '~/server/utils/prisma'
import { deleteMultipleObjects } from '~/server/utils/s3'

// Вспомогательная рекурсивная функция для сбора всех s3Key.
// Она остается здесь, так как тесно связана с логикой Prisma, а не S3.
async function collectAllAssetKeys(folderId: number | null, userId: number): Promise<string[]> {
    let keys: string[] = []

    // Собираем ключи файлов в текущей папке
    const files = await prisma.fileAsset.findMany({
        where: { personalFileMeta: { folderId }, userId },
        select: { s3Key: true }
    })
    keys.push(...files.map(f => f.s3Key))

    // Рекурсивно собираем ключи из дочерних папок
    const subFolders = await prisma.personalFolder.findMany({
        where: { parentId: folderId, userId },
        select: { id: true }
    })

    for (const subFolder of subFolders) {
        const subFolderKeys = await collectAllAssetKeys(subFolder.id, userId)
        keys.push(...subFolderKeys)
    }

    return keys
}


export default defineEventHandler(async (event) => {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, message: 'Требуется авторизация' })

    const folderId = parseInt(event.context.params!.id, 10)
    if (isNaN(folderId)) throw createError({ statusCode: 400, message: 'Неверный ID' })

    // 1. Проверяем, что папка принадлежит пользователю
    const folderToDelete = await prisma.personalFolder.findUnique({
        where: { id: folderId, userId: user.userId }
    })
    if (!folderToDelete) throw createError({ statusCode: 404, message: 'Папка не найдена или у вас нет прав на ее удаление' })

    // 2. Рекурсивно собираем все ключи S3 для удаления
    const keysToDelete = await collectAllAssetKeys(folderId, user.userId)

    // 3. Вызываем утилиту для массового удаления из S3 
    await deleteMultipleObjects(keysToDelete)

    // 4. Удаляем саму папку из БД. Prisma сама удалит все вложенные папки и мета-записи.
    await prisma.personalFolder.delete({
        where: { id: folderId },
    })

    setResponseStatus(event, 204)
})