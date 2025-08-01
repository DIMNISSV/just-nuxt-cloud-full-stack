// server/api/v1/storage/asset/[id]_.delete.ts

import prisma from '~/server/utils/prisma'
import { deleteObject } from '~/server/utils/s3'
import { downloadUrlQueue } from '~/server/utils/queue'

export default defineEventHandler(async (event) => {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, message: 'Требуется авторизация' })

    const assetId = parseInt(event.context.params!.id, 10)
    if (isNaN(assetId)) throw createError({ statusCode: 400, message: 'Неверный ID' })

    const assetToDelete = await prisma.fileAsset.findUnique({
        where: { id: assetId },
    })

    if (!assetToDelete) {
        return setResponseStatus(event, 204)
    }

    if (assetToDelete.userId !== user.userId) {
        throw createError({ statusCode: 403, message: 'Доступ запрещен' })
    }

    // ★ ИЗМЕНЕНИЕ: Если ассет в очереди на скачивание, отменяем задачу
    if (assetToDelete.status === 'PENDING') {
        const jobId = `download-asset-${assetToDelete.id}`;
        try {
            const job = await downloadUrlQueue.getJob(jobId);
            if (job) {
                await job.remove();
                console.log(`[API] Задача #${jobId} успешно удалена из очереди.`);
            }
        } catch (e) {
            console.error(`[API] Ошибка при попытке удаления задачи #${jobId} из очереди:`, e);
            // Не прерываем выполнение, просто логируем ошибку
        }
    }

    // Воркер может не успеть создать файл в S3, поэтому удаляем с проверкой
    if (assetToDelete.s3Key) {
        await deleteObject(assetToDelete.s3Key);
    }

    await prisma.fileAsset.delete({
        where: { id: assetId },
    })

    setResponseStatus(event, 204)
})