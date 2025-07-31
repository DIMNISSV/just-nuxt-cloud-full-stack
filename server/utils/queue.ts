import { Queue } from 'bullmq'

// Определяем структуру данных, которые будет нести наша задача.
// Это обеспечивает типобезопасность при обработке в воркере.
export interface UrlJobData {
    uploadId: number
}

// В эту очередь будут попадать все задачи, связанные с обработкой URL.
const queueName = 'url-processing'

// Настройки подключения к Redis. BullMQ использует тот же клиент, что и обычный Redis.
// Эти опции лучше выносить в runtimeConfig для гибкости, но для текущего этапа
// можно оставить их, т.к. они стандартны для вашего docker-compose.yml.
const connection = {
    host: process.env.REDIS_HOST || '127.0.0.1', // Для Docker лучше использовать имя сервиса 'jm-redis'
    port: 6379,
}

// Создаем и экспортируем экземпляр очереди.
// Он будет использоваться в API для добавления новых задач.
export const urlProcessingQueue = new Queue<UrlJobData>(queueName, {
    connection,
    defaultJobOptions: {
        attempts: 3, // 3 попытки выполнения задачи в случае сбоя
        backoff: {
            type: 'exponential',
            delay: 1000, // Задержка перед повторной попыткой
        },
    },
})

/**
 * Вспомогательная функция для добавления задачи в очередь обработки URL.
 * @param data - Данные задачи, содержащие ID загрузки.
 */
export async function addUrlJob(data: UrlJobData) {
    // Второй аргумент - это данные задачи.
    // Третий - опции. Мы используем uploadId как jobId для предотвращения дубликатов.
    await urlProcessingQueue.add('process-url', data, {
        jobId: `upload-${data.uploadId}`,
        removeOnComplete: true, // Автоматически удалять успешные задачи
        removeOnFail: 1000,     // Хранить последние 1000 неуспешных задач для анализа
    })

    console.log(`[Queue] Добавлена задача в очередь '${queueName}' для uploadId: ${data.uploadId}`)
}