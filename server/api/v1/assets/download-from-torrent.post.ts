import prisma from '~/server/utils/prisma'
import { addTorrentJob } from '~/server/utils/queue'
import type { AssetType } from '@prisma/client'

interface DownloadFromTorrentPayload {
    magnetLink: string; // Полная magnet-ссылка все еще нужна для Transmission
    infoHash: string;
    files: { path: string, index: number }[]; // Пользователь отправляет список выбранных файлов
    assetType: AssetType;
    folderId?: number;
}

export default defineEventHandler(async (event) => {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, message: 'Требуется авторизация' })

    const body = await readBody<DownloadFromTorrentPayload>(event)
    if (!body.magnetLink || !body.infoHash || !body.files || body.files.length === 0) {
        throw createError({ statusCode: 400, message: 'Необходимы magnetLink, infoHash и список файлов' })
    }

    // Здесь мы не создаем FileAsset сразу. Этим займется воркер,
    // когда Transmission скачает файлы.
    // Вместо этого мы создаем одну "задачу-контейнер" на весь торрент.

    // TODO: В будущем можно создать модель TorrentJob в Prisma для отслеживания.
    // Пока для простоты просто ставим задачу в очередь.

    await addTorrentJob({
        magnetLink: body.magnetLink,
        infoHash: body.infoHash,
        filesToDownload: body.files.map(f => f.index), // Передаем только индексы
        userId: user.userId,
        assetType: body.assetType,
        folderId: body.folderId,
    })

    return {
        message: 'Торрент успешно добавлен в очередь на скачивание.',
    }
})