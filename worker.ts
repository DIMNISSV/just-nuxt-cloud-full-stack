import { Worker } from 'bullmq'
import { execa } from 'execa'
import path from 'path'
import { mkdir, readdir, rm, stat } from 'fs/promises'
import { createReadStream } from 'fs'
import mime from 'mime-types' // Понадобится для определения MIME-типа
import prisma from './server/utils/prisma'
import { uploadToS3 } from './server/utils/s3'
import { appConfig, runtimeConfig } from './config'
import { AssetType, Prisma } from '@prisma/client'
import type { DownloadUrlJobData, ProcessMediaJobData, WatchMetadataJobData } from './server/utils/queue'
import { addMediaJob } from './server/utils/queue'

// Установка: npm install mime-types @types/mime-types

// --- КОНФИГУРАЦИЯ ---
const redisConfig = runtimeConfig.redis
const connection = { host: redisConfig.host, port: redisConfig.port }
const tempDirBase = appConfig.worker.tempDir

// === ОБРАБОТЧИК ЗАГРУЗКИ ПО URL ===
const downloadUrlWorker = new Worker<DownloadUrlJobData>(
    'download-url-job',
    async (job) => {
        const { assetId, sourceUrl } = job.data
        console.log(`[DownloadWorker] Начата загрузка по URL для Asset ID: ${assetId}`)

        const asset = await prisma.fileAsset.findUnique({ where: { id: assetId } })
        if (!asset) {
            throw new Error(`Ассет ${assetId} не найден.`)
        }

        // Создаем временную папку для скачивания
        const tempDir = path.join(tempDirBase, asset.uuid)
        await mkdir(tempDir, { recursive: true })

        try {
            await prisma.fileAsset.update({
                where: { id: assetId },
                data: { status: 'PROCESSING' },
            })

            // Скачиваем файл с помощью yt-dlp во временную папку
            await execa(appConfig.binaries.ytdlp, [
                '-P', tempDir,
                '-o', '%(title)s.%(ext)s',
                sourceUrl
            ])

            const files = await readdir(tempDir)
            if (files.length === 0) throw new Error('Файл не был скачан.')

            const downloadedFilename = files[0]
            const localFilePath = path.join(tempDir, downloadedFilename)
            const fileStat = await stat(localFilePath)

            // Генерируем постоянный S3 ключ
            const permanentS3Key = asset.assetType === 'PERSONAL'
                ? `personal/${asset.userId}/${asset.uuid}/${downloadedFilename}`
                : `media/sources/${asset.uuid}/${downloadedFilename}`

            // Загружаем скачанный файл в S3
            await uploadToS3(localFilePath, permanentS3Key)

            // Обновляем запись в БД с финальными данными
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

            // Если это медиа, ставим следующую задачу на обработку
            if (updatedAsset.assetType === 'MEDIA_SOURCE') {
                await addMediaJob({ assetId: updatedAsset.id })
            }

            console.log(`[DownloadWorker] ✅ Файл для ассета #${assetId} успешно скачан и загружен в S3.`)
        } catch (error: any) {
            const errorMessage = error.stderr || error.message || 'Неизвестная ошибка воркера'
            await prisma.fileAsset.update({
                where: { id: assetId },
                data: { status: 'ERROR' }, // Устанавливаем статус ошибки в основной модели
            })
            console.error(`[DownloadWorker] ❌ Ошибка при обработке ассета #${assetId}:`, errorMessage)
            throw error // Перевыбрасываем ошибку для BullMQ
        } finally {
            // Очищаем временную папку
            await rm(tempDir, { recursive: true, force: true })
        }
    },
    { connection }
)

// === ОБРАБОТЧИК МЕДИА-КОНВЕЙЕРА (пока заглушка) ===
const processMediaWorker = new Worker<ProcessMediaJobData>('process-media-job', async (job) => {
    console.log(`[MediaWorker Stub] Получена задача для обработки медиа. AssetId: ${job.data.assetId}`);
    // Здесь будет логика из Коммита 4.1
    await new Promise(resolve => setTimeout(resolve, 5000));
    // Имитация успешной обработки
    await prisma.fileAsset.update({
        where: { id: job.data.assetId },
        data: { status: 'AVAILABLE' }
    });
    console.log(`[MediaWorker Stub] Задача ${job.id} 'завершена'.`);
}, { connection });

// === ЗАДАЧА-СТОРОЖ ЗА МЕТАДАННЫМИ ===
const watchMetadataWorker = new Worker<WatchMetadataJobData>(
    'watch-metadata-job',
    async (job) => {
        const { torrentId, hashString } = job.data;
        console.log(`[WatcherWorker] Проверка метаданных для торрента ID: ${torrentId}`);

        const { torrents } = await transmission.get(torrentId, ['metadataPercentComplete', 'files']);

        if (!torrents || torrents.length === 0) {
            console.warn(`[WatcherWorker] Торрент ID ${torrentId} не найден в Transmission. Задача отменена.`);
            return; // Торрент могли удалить, задача больше не актуальна
        }

        const torrent = torrents[0];

        if (torrent.metadataPercentComplete < 1) {
            // Метаданные еще не готовы, перевыбрасываем ошибку,
            // чтобы BullMQ попробовал снова через 2 секунды (согласно настройкам backoff)
            throw new Error(`Метаданные для ${hashString} еще не готовы (${torrent.metadataPercentComplete * 100}%). Повторная попытка...`);
        }

        // МЕТАДАННЫЕ ГОТОВЫ
        console.log(`[WatcherWorker] Метаданные для ${hashString} получены!`);

        // Получаем список всех индексов файлов
        const allFileIndexes = torrent.files.map((_: any, index: number) => index);

        // Отправляем команду остановить скачивание всех файлов
        await transmission.set(torrentId, {
            'files-unwanted': allFileIndexes
        });

        console.log(`[WatcherWorker] Скачивание ВСЕХ файлов для торрента ${hashString} остановлено. Ожидание выбора пользователя.`);
        // На этом работа "сторожа" завершена. Он успешно выполнится и будет удален из очереди.
    },
    { connection }
);



// --- Логирование событий ---
downloadUrlWorker.on('completed', job => console.log(`[Queue] Завершена задача 'download-url' #${job.id}`));
downloadUrlWorker.on('failed', (job, err) => console.error(`[Queue] Ошибка в задаче 'download-url' #${job?.id}: ${err.message}`));
processMediaWorker.on('completed', job => console.log(`[Queue] Завершена задача 'process-media' #${job.id}`));
processMediaWorker.on('failed', (job, err) => console.error(`[Queue] Ошибка в задаче 'process-media' #${job?.id}: ${err.message}`));

watchMetadataWorker.on('completed', job => console.log(`[Queue] Завершена задача 'watch-metadata' #${job.id}`));
watchMetadataWorker.on('failed', (job, err) => console.error(`[Queue] Ошибка в задаче 'watch-metadata' #${job?.id}: ${err.message}`));


console.log('🚀 Воркеры запущены и готовы к работе...');