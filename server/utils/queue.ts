// server/utils/queue.ts

import { Queue } from 'bullmq'
import { runtimeConfig } from '../../config'

const redisConfig = runtimeConfig.redis
const connection = {
    host: redisConfig.host,
    port: redisConfig.port,
}

// ======================================================================
// ОЧЕРЕДЬ ДЛЯ ЗАГРУЗКИ ПО URL
// ======================================================================
const downloadUrlQueueName = 'download-url-job'

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
    await downloadUrlQueue.add('download-url', data, {
        jobId: `download-node-${data.nodeUuid}`,
        removeOnComplete: true,
        removeOnFail: 1000,
    })
    console.log(`[Queue] Добавлена задача в '${downloadUrlQueueName}' для nodeUuid: ${data.nodeUuid}`)
}