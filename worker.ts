import { Worker } from 'bullmq'
import { execa } from 'execa'
import path from 'path'
import { mkdir, readdir, rm, stat } from 'fs/promises'
import mime from 'mime-types'
import prisma from './server/utils/prisma'
import { uploadToS3 } from './server/utils/s3'
import { appConfig, runtimeConfig } from './config'
import type { DownloadUrlJobData, ProcessMediaJobData } from './server/utils/queue'
import { addMediaJob } from './server/utils/queue'
// console.log(await transmission.all())

// --- КОНФИГУРАЦИЯ ---
const redisConfig = runtimeConfig.redis
const connection = { host: redisConfig.host, port: redisConfig.port }
const tempDirBase = appConfig.worker.tempDir
console.log('[Worker] Попытка подключения к Redis:', connection);
// ======================================================================
// 1. ВОРКЕР ЗАГРУЗКИ ПО URL
// ======================================================================
const downloadUrlWorker = new Worker<DownloadUrlJobData>(
    'download-url-job',
    async (job) => {
        // ... (этот код работает и остается без изменений)
        const { assetId, sourceUrl } = job.data
        console.log(`[DownloadWorker] Начата загрузка по URL для Asset ID: ${assetId}`)

        const asset = await prisma.fileAsset.findUnique({ where: { id: assetId } })
        if (!asset) throw new Error(`Ассет ${assetId} не найден.`)

        const tempDir = path.join(tempDirBase, asset.uuid)
        await mkdir(tempDir, { recursive: true })

        try {
            await prisma.fileAsset.update({ where: { id: assetId }, data: { status: 'PROCESSING' } })
            await execa(appConfig.binaries.ytdlp, ['-P', tempDir, '-o', '%(title)s.%(ext)s', sourceUrl])
            const files = await readdir(tempDir)
            if (files.length === 0) throw new Error('Файл не был скачан.')
            const downloadedFilename = files[0]
            const localFilePath = path.join(tempDir, downloadedFilename)
            const fileStat = await stat(localFilePath)
            const permanentS3Key = asset.assetType === 'PERSONAL'
                ? `personal/${asset.userId}/${asset.uuid}/${downloadedFilename}`
                : `media/sources/${asset.uuid}/${downloadedFilename}`
            await uploadToS3(localFilePath, permanentS3Key)
            const finalStatus = asset.assetType === 'MEDIA_SOURCE' ? 'PROCESSING' : 'AVAILABLE'
            const updatedAsset = await prisma.fileAsset.update({
                where: { id: assetId },
                data: {
                    originalFilename: downloadedFilename,
                    s3Key: permanentS3Key,
                    sizeBytes: fileStat.size,
                    mimeType: mime.lookup(localFilePath) || 'application/octet-stream',
                    status: finalStatus,
                },
            })
            if (updatedAsset.assetType === 'MEDIA_SOURCE') {
                await addMediaJob({ assetId: updatedAsset.id })
            }
            console.log(`[DownloadWorker] ✅ Файл для ассета #${assetId} успешно скачан и загружен в S3.`)
        } catch (error: any) {
            const errorMessage = error.stderr || error.message || 'Неизвестная ошибка воркера'
            await prisma.fileAsset.update({ where: { id: assetId }, data: { status: 'ERROR' } })
            console.error(`[DownloadWorker] ❌ Ошибка при обработке ассета #${assetId}:`, errorMessage)
            throw error
        } finally {
            await rm(tempDir, { recursive: true, force: true })
        }
    },
    { connection }
)

// ======================================================================
// 2. ВОРКЕРЫ-ЗАГЛУШКИ ДЛЯ БУДУЩИХ КОММИТОВ
// ======================================================================
const processMediaWorker = new Worker<ProcessMediaJobData>('process-media-job', async (job) => {
    console.log(`[MediaWorker Stub] Получена задача для обработки медиа. AssetId: ${job.data.assetId}`);
    await new Promise(resolve => setTimeout(resolve, 5000));
    await prisma.fileAsset.update({ where: { id: job.data.assetId }, data: { status: 'AVAILABLE' } });
    console.log(`[MediaWorker Stub] Задача ${job.id} 'завершена'.`);
}, { connection });

// const processTorrentWorker = new Worker<ProcessTorrentJobData>('process-torrent-job', async (job) => {
//     console.log(`[TorrentWorker Stub] Начата обработка торрента: ${job.data.hashString}`);
//     await new Promise(resolve => setTimeout(resolve, 10000));
//     console.log(`[TorrentWorker Stub] Задача ${job.id} 'завершена'.`);
// }, { connection });
// const watchMetadataWorker = new Worker<WatchMetadataJobData>(
//     'watch-metadata-job',
//     async (job) => {
//         console.log(`[WatcherWorker] ВЗЯЛ В РАБОТУ ЗАДАЧУ #${job.id} для торрента ID: ${job.data.torrentId}`);
//         await new Promise(resolve => setTimeout(resolve, 10000));
//         console.log(`[WatcherWorker] Скачивание ВСЕХ файлов для торрента ${hashString} остановлено.`);
//     },
//     { connection }
// );

// ======================================================================
// ГЛОБАЛЬНОЕ ЛОГИРОВАНИЕ СОБЫТИЙ ВОРКЕРОВ
// ======================================================================
const workers = [downloadUrlWorker, processMediaWorker];

workers.forEach(worker => {
    worker.on('completed', job => console.log(`[Queue] Завершена задача #${job.id} в очереди '${worker.name}'`));
    worker.on('failed', (job, err) => console.error(`[Queue] Ошибка в задаче #${job?.id} в очереди '${worker.name}': ${err.message}`));
});

console.log('🚀 Все воркеры запущены и готовы к работе...');