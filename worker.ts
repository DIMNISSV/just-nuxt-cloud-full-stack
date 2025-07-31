// worker.ts - Ожидает рефакторинга в Спринте 3

import { Worker } from 'bullmq'
import { runtimeConfig } from './config'

const redisConfig = runtimeConfig.redis
const connection = { host: redisConfig.host, port: redisConfig.port }

// Просто создаем пустой воркер, который ничего не делает,
// чтобы скрипт `npm run worker` не падал с ошибкой.
// Мы добавим реальную логику в Коммите 3.1.
const processMediaWorker = new Worker('process-media-job', async (job) => {
    console.log(`[Worker Stub] Получена задача для обработки медиа, но логика еще не реализована. AssetId: ${job.data.assetId}`);
    // Имитация работы
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log(`[Worker Stub] Задача ${job.id} 'завершена'.`);
}, { connection });

processMediaWorker.on('completed', job => console.log(`[Queue] Завершено: задача ${job.id} успешно выполнена.`));
processMediaWorker.on('failed', (job, err) => console.error(`[Queue] Ошибка: задача ${job?.id} провалена с ошибкой: ${err.message}`));

console.log('🚀 Воркер (в режиме заглушки) запущен...');