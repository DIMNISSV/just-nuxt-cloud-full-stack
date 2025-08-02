import { Worker } from 'bullmq'
// import { execa } from 'execa'
// import path from 'path'
// import { mkdir, readdir, rm, stat } from 'fs/promises'
// import mime from 'mime-types'
import prisma from './server/utils/prisma'
// import { uploadToS3 } from './server/utils/s3'
import { appConfig, runtimeConfig } from './config'
import type { DownloadUrlJobData, ProcessMediaJobData } from './server/utils/queue'
import { NodeStatus } from '@prisma/client'
// import { addMediaJob } from './server/utils/queue'

// --- КОНФИГУРАЦИЯ ---
const redisConfig = runtimeConfig.redis
const connection = { host: redisConfig.host, port: redisConfig.port }
console.log('[Worker] Попытка подключения к Redis:', connection);

// ======================================================================
// 1. ВОРКЕР ЗАГРУЗКИ ПО URL (ЗАГЛУШКА ДЛЯ СПРИНТА 2)
// ======================================================================
// TODO: Переписать логику с использованием StorageNode в Спринте 2
const downloadUrlWorker = new Worker<DownloadUrlJobData>(
    'download-url-job',
    async (job) => {
        const { nodeId, sourceUrl } = job.data
        console.log(`[DownloadWorker STUB] Получена задача для URL: ${sourceUrl}, Node ID: ${nodeId}.`);
        await new Promise(resolve => setTimeout(resolve, 5000)); // Имитация работы
        console.log(`[DownloadWorker STUB] Задача для Node ID: ${nodeId} 'завершена'.`);
    },
    { connection }
)

// ======================================================================
// 2. ВОРКЕР ОБРАБОТКИ МЕДИА (ЗАГЛУШКА ДЛЯ СПРИНТА 3)
// ======================================================================
const processMediaWorker = new Worker<ProcessMediaJobData>('process-media-job', async (job) => {
    console.log(`[MediaWorker STUB] Получена задача для обработки медиа. NodeId: ${job.data.nodeId}`);
    // Имитируем долгую обработку
    await prisma.storageNode.update({ where: { id: job.data.nodeId }, data: { status: NodeStatus.PROCESSING } });
    await new Promise(resolve => setTimeout(resolve, 10000)); // Имитация ffmpeg
    // По завершению "обработки" помечаем файл как доступный
    await prisma.storageNode.update({ where: { id: job.data.nodeId }, data: { status: NodeStatus.AVAILABLE } });
    console.log(`[MediaWorker STUB] Задача ${job.id} 'завершена'.`);
}, { connection });


// ======================================================================
// ГЛОБАЛЬНОЕ ЛОГИРОВАНИЕ СОБЫТИЙ ВОРКЕРОВ
// ======================================================================
const workers = [downloadUrlWorker, processMediaWorker];

workers.forEach(worker => {
    worker.on('completed', job => console.log(`[Queue] Завершена задача #${job.id} в очереди '${worker.name}'`));
    worker.on('failed', (job, err) => console.error(`[Queue] Ошибка в задаче #${job?.id} в очереди '${worker.name}': ${err.message}`));
});

console.log('🚀 Все воркеры запущены и готовы к работе...');