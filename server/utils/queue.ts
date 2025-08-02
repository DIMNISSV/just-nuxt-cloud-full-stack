import { Queue } from 'bullmq'
import { runtimeConfig } from '../../config'

// --- КОНФИГУРАЦИЯ ---
const redisConfig = runtimeConfig.redis
const connection = {
    host: redisConfig.host,
    port: redisConfig.port,
}

// ======================================================================
// 1. ОЧЕРЕДЬ ДЛЯ ОБРАБОТКИ МЕДИА
// ======================================================================

const processMediaQueueName = 'process-media-job'

// ★ ИЗМЕНЕНИЕ: Данные для задачи теперь содержат `nodeId` вместо `assetId`
export interface ProcessMediaJobData {
    nodeId: number
}

export const processMediaQueue = new Queue<ProcessMediaJobData>(processMediaQueueName, {
    connection,
    defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
    },
})

/**
 * Вспомогательная функция для добавления задачи на обработку медиа-узла.
 * @param data - Данные задачи, содержащие ID узла.
 */
export async function addMediaJob(data: ProcessMediaJobData) {
    // ★ ИЗМЕНЕНИЕ: Используем `nodeId` для генерации уникального ID задачи
    await processMediaQueue.add('process-media', data, {
        jobId: `node-${data.nodeId}`, // Уникальность по ID узла
        removeOnComplete: true,
        removeOnFail: 1000,
    })
    console.log(`[Queue] Добавлена задача в '${processMediaQueueName}' для nodeId: ${data.nodeId}`)
}


// ======================================================================
// 2. ОЧЕРЕДЬ ДЛЯ ЗАГРУЗКИ ПО URL
// ======================================================================

const downloadUrlQueueName = 'download-url-job'

// ★ ИЗМЕНЕНИЕ: Данные для задачи теперь содержат `nodeId` вместо `assetId`
export interface DownloadUrlJobData {
    nodeId: number;
    sourceUrl: string;
}

export const downloadUrlQueue = new Queue<DownloadUrlJobData>(downloadUrlQueueName, {
    connection,
    defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
    },
});

export async function addDownloadUrlJob(data: DownloadUrlJobData) {
    // ★ ИЗМЕНЕНИЕ: Используем `nodeId` для генерации уникального ID задачи
    await downloadUrlQueue.add('download-url', data, {
        jobId: `download-node-${data.nodeId}`,
        removeOnComplete: true,
        removeOnFail: 1000,
    })
    console.log(`[Queue] Добавлена задача в '${downloadUrlQueueName}' для nodeId: ${data.nodeId}`)
}