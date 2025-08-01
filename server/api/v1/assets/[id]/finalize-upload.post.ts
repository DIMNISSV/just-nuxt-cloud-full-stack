import prisma from '~/server/utils/prisma'
import { objectExists, moveObject } from '~/server/utils/s3'
import { addMediaJob } from '~/server/utils/queue'
// import { AssetType } from '@prisma/client'

export default defineEventHandler(async (event) => {
    // ... (весь код до `updatedAsset` остается без изменений) ...
    const user = event.context.user;
    if (!user) {
        throw createError({ statusCode: 401, message: 'Требуется авторизация' });
    }

    const assetId = parseInt(event.context.params!.id, 10);
    if (isNaN(assetId)) {
        throw createError({ statusCode: 400, message: 'Некорректный ID ассета' });
    }

    const asset = await prisma.fileAsset.findUnique({
        where: { id: assetId },
    });

    if (!asset) {
        throw createError({ statusCode: 404, message: 'Ассет не найден' });
    }
    if (asset.userId !== user.userId) {
        throw createError({ statusCode: 403, message: 'Доступ запрещен' });
    }
    if (asset.status !== 'PENDING') {
        throw createError({ statusCode: 409, message: `Неверный статус ассета: ${asset.status}. Ожидался PENDING.` });
    }

    const tempS3Key = asset.s3Key;

    const isUploaded = await objectExists(tempS3Key);
    if (!isUploaded) {
        await prisma.fileAsset.delete({ where: { id: assetId } });
        throw createError({ statusCode: 400, message: 'Файл не был загружен в S3. Запись удалена.' });
    }

    let permanentS3Key: string;
    if (asset.assetType === AssetType.PERSONAL) {
        permanentS3Key = `personal/${user.userId}/${asset.uuid}/${asset.originalFilename}`;
    } else { // MEDIA_SOURCE
        permanentS3Key = `media/sources/${asset.uuid}/${asset.originalFilename}`;
    }

    await moveObject(tempS3Key, permanentS3Key);

    const finalStatus = asset.assetType === AssetType.MEDIA_SOURCE ? 'PROCESSING' : 'AVAILABLE';

    const updatedAsset = await prisma.fileAsset.update({
        where: { id: assetId },
        data: {
            s3Key: permanentS3Key,
            status: finalStatus,
        },
    });

    if (updatedAsset.assetType === AssetType.MEDIA_SOURCE) {
        await addMediaJob({ assetId: updatedAsset.id });
    }

    console.log(`Ассет #${assetId} успешно финализирован. Новый статус: ${finalStatus}`);

    return {
        ...updatedAsset,
        sizeBytes: Number(updatedAsset.sizeBytes),
    };
})