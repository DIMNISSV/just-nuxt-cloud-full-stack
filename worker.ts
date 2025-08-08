import { Worker } from 'bullmq'
import { execa } from 'execa'
import path from 'path'
import { mkdir, readdir, rm, stat } from 'fs/promises'
import mime from 'mime-types'
import prisma from './server/utils/prisma'
import { uploadToS3 } from './server/utils/s3'
import { appConfig, runtimeConfig } from './config'
import type { DownloadUrlJobData, ProcessMediaJobData } from './server/utils/queue'
import { NodeStatus } from '@prisma/client'

// --- КОНФИГУРАЦИЯ ---
const redisConfig = runtimeConfig.redis
const connection = { host: redisConfig.host, port: redisConfig.port }
const tempDirBase = appConfig.worker.tempDir
console.log('[Worker] Попытка подключения к Redis:', connection);

// ======================================================================
// 1. ВОРКЕР ЗАГРУЗКИ ПО URL (★ НОВАЯ ЛОГИКА)
// ======================================================================
const downloadUrlWorker = new Worker<DownloadUrlJobData>(
    'download-url-job',
    async (job) => {
        const { nodeUuid, sourceUrl } = job.data;
        console.log(`[DownloadWorker] Начата обработка URL: ${sourceUrl} для Node: ${nodeUuid}`);

        // ★ ИЗМЕНЕНИЕ: Теперь мы запрашиваем и ownerId, и meta
        const node = await prisma.storageNode.findUnique({
            where: { uuid: nodeUuid },
            select: { ownerId: true, meta: true }
        });
        if (!node) throw new Error(`Узел ${nodeUuid} не найден в базе данных.`);

        const tempDir = path.join(tempDirBase, nodeUuid);
        await mkdir(tempDir, { recursive: true });

        try {
            await prisma.storageNode.update({ where: { uuid: nodeUuid }, data: { status: NodeStatus.PROCESSING } });
            await execa(appConfig.binaries.ytdlp, ['-P', tempDir, '-o', '%(title)s.%(ext)s', sourceUrl]);

            const files = await readdir(tempDir);
            if (files.length === 0) throw new Error('yt-dlp не скачал ни одного файла.');

            const downloadedFilename = files[0];
            const localFilePath = path.join(tempDir, downloadedFilename);
            const fileStat = await stat(localFilePath);

            const permanentS3Key = `drive/${node.ownerId}/${nodeUuid}/${encodeURIComponent(downloadedFilename)}`;
            await uploadToS3(localFilePath, permanentS3Key);

            await prisma.storageNode.update({
                where: { uuid: nodeUuid },
                data: {
                    name: downloadedFilename,
                    s3Key: permanentS3Key,
                    sizeBytes: fileStat.size,
                    mimeType: mime.lookup(localFilePath) || 'application/octet-stream',
                    status: NodeStatus.AVAILABLE,
                },
            });
            console.log(`[DownloadWorker] ✅ Успешно обработан Node: ${nodeUuid}`);

        } catch (error: any) {
            const errorMessage = error.stderr || error.message || 'Неизвестная ошибка воркера';
            await prisma.storageNode.update({
                where: { uuid: nodeUuid },
                data: { status: NodeStatus.ERROR, meta: { ...(node.meta as object || {}), error: errorMessage } },
            });
            console.error(`[DownloadWorker] ❌ Ошибка при обработке Node ${nodeUuid}:`, errorMessage);
            throw error;
        } finally {
            await rm(tempDir, { recursive: true, force: true });
        }
    },
    { connection }
);

// ======================================================================
// 2. ВОРКЕР ОБРАБОТКИ МЕДИА (ЗАГЛУШКА ДЛЯ СПРИНТА 3)
// ======================================================================
const processMediaWorker = new Worker<ProcessMediaJobData>('process-media-job', async (job) => {
    // ... заглушка без изменений ...
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