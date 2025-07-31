import { Queue } from 'bullmq'
import { runtimeConfig } from '../../config' // Импортируем нашу общую конфигурацию

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