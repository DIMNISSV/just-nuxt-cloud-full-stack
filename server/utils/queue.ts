// server/utils/queue.ts

import { Queue } from 'bullmq'
import { runtimeConfig } from '../../config'

const redisConfig = runtimeConfig.redis
const connection = {
    host: redisConfig.host,
    port: redisConfig.port,
}

// ======================================================================
// 1. ОЧЕРЕДЬ ДЛЯ ОБРАБОТКИ МЕДИА (для будущего)
// ======================================================================
const processMediaQueueName = 'process-media-job'
export interface ProcessMediaJobData {
    nodeUuid: string;
}
export const processMediaQueue = new Queue<ProcessMediaJobData>(processMediaQueueName, {
    connection,
    defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
    },
})
export async function addMediaJob(data: ProcessMediaJobData) {
    await processMediaQueue.add('process-media', data, {
        jobId: `process-node-${data.nodeUuid}`,
        removeOnComplete: true,
        removeOnFail: 1000,
    })
    console.log(`[Queue] Добавлена задача в '${processMediaQueueName}' для nodeUuid: ${data.nodeUuid}`)
}

// ======================================================================
// 2. ОЧЕРЕДЬ ДЛЯ ЗАГРУЗКИ ПО URL
// ======================================================================
const downloadUrlQueueName = 'download-url-job'

// ★ ИЗМЕНЕНИЕ: Интерфейс теперь использует nodeUuid: string
export interface DownloadUrlJobData {
    nodeUuid: string;
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
    // ★ ИЗМЕНЕНИЕ: ID задачи теперь генерируется на основе UUID
    await downloadUrlQueue.add('download-url', data, {
        jobId: `download-node-${data.nodeUuid}`,
        removeOnComplete: true,
        removeOnFail: 1000,
    })
    console.log(`[Queue] Добавлена задача в '${downloadUrlQueueName}' для nodeUuid: ${data.nodeUuid}`)
}