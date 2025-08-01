import { Queue } from 'bullmq'
import { runtimeConfig } from '../../config' // Импортируем нашу общую конфигурацию
import { AssetType } from '@prisma/client'

// === НОВАЯ ОЧЕРЕДЬ ДЛЯ ОБРАБОТКИ МЕДИА ===
const processMediaQueueName = 'process-media-job'

// Данные, которые будет нести задача: ID ассета, который нужно обработать.
export interface ProcessMediaJobData {
    assetId: number
}

const redisConfig = runtimeConfig.redis

const connection = {
    host: redisConfig.host,
    port: redisConfig.port,
}

// Экспортируем экземпляр очереди.
export const processMediaQueue = new Queue<ProcessMediaJobData>(processMediaQueueName, {
    connection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 5000, // Увеличим задержку для медиа-задач
        },
    },
})

/**
 * Вспомогательная функция для добавления задачи на обработку медиа-ассета.
 * @param data - Данные задачи, содержащие ID ассета.
 */
export async function addMediaJob(data: ProcessMediaJobData) {
    // Используем assetId как часть jobId для предотвращения дубликатов.
    await processMediaQueue.add('process-media', data, {
        jobId: `asset-${data.assetId}`,
        removeOnComplete: true,
        removeOnFail: 1000,
    })

    console.log(`[Queue] Добавлена задача в очередь '${processMediaQueueName}' для assetId: ${data.assetId}`)
}


// === ОЧЕРЕДЬ ДЛЯ ЗАГРУЗКИ ПО URL (из следующего спринта, но создаем сейчас) ===
const downloadUrlQueueName = 'download-url-job'

export interface DownloadUrlJobData {
    assetId: number;
    sourceUrl: string;
}

export const downloadUrlQueue = new Queue<DownloadUrlJobData>(downloadUrlQueueName, {
    connection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
    },
});

export async function addDownloadUrlJob(data: DownloadUrlJobData) {
    await downloadUrlQueue.add('download-url', data, {
        jobId: `download-asset-${data.assetId}`,
        removeOnComplete: true,
        removeOnFail: 1000,
    })
    console.log(`[Queue] Добавлена задача в очередь '${downloadUrlQueueName}' для assetId: ${data.assetId}`)
}


// TODO: На текущий момент ОНО НЕ ДОБАВИТ торрент, который уже ранее кто-то пытался добавить.
// Во-первых, надо правильно настроить Redis, чтобы он дублировал задачи.
// Во-вторых, что делать если два разных пользователя загрузили один и тот же торрент?
// На текущий момент эта задача отложена, как СЛОЖНАЯ.

// const processTorrentQueueName = 'process-torrent-job'

// export interface ProcessTorrentJobData {
//     torrentId: number; // ID в Transmission
//     hashString: string;
//     filesToProcess: { index: number, name: string }[]; // Файлы, которые нужно отслеживать и обработать
//     userId: number;
//     assetType: AssetType;
//     folderId?: number;
// }

// export const processTorrentQueue = new Queue<ProcessTorrentJobData>(processTorrentQueueName, {
//     connection,
//     defaultJobOptions: {
//         attempts: 2, // Меньше попыток для торрентов
//         backoff: { type: 'exponential', delay: 10000 },
//     },
// });

// export async function addTorrentJob(data: ProcessTorrentJobData) {
//     await processTorrentQueue.add('process-torrent', data, {
//         jobId: `torrent-${data.hashString}`, // Используем infoHash для уникальности
//         removeOnComplete: true,
//         removeOnFail: 1000,
//     })
//     console.log(`[Queue] Добавлена задача в очередь '${processTorrentQueueName}' для infoHash: ${data.hashString}`)
// }

// // === ОЧЕРЕДЬ ДЛЯ СЛЕЖЕНИЯ ЗА МЕТАДАННЫМИ ===
// const watchMetadataQueueName = 'watch-metadata-job'

// export interface WatchMetadataJobData {
//     torrentId: number; // ID в Transmission
//     hashString: string;
// }

// export const watchMetadataQueue = new Queue<WatchMetadataJobData>(watchMetadataQueueName, {
//     connection,
//     defaultJobOptions: {
//         attempts: 0, // Можно сделать побольше попыток
//         backoff: {
//             type: 'fixed',
//             delay: 2000,
//         }
//     },
// });

// export async function addWatchMetadataJob(data: WatchMetadataJobData) {
//     await watchMetadataQueue.add('watch-metadata', data, {
//         jobId: `watch-${data.hashString}`,
//         removeOnComplete: true,
//         removeOnFail: false,
        
//     })
//     console.log(`[Queue] Добавлена задача в очередь '${watchMetadataQueueName}' для hashString: ${data.hashString}`)
// }
