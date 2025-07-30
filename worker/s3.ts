import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { createReadStream } from 'fs'
import { stat } from 'fs/promises'
import path from 'path'
import { runtimeConfig } from '../config'

// Получаем конфигурацию S3
const s3Config = runtimeConfig.s3

if (!s3Config.endpoint || !s3Config.accessKeyId || !s3Config.secretAccessKey || !s3Config.bucket) {
    throw new Error('Конфигурация S3 не заполнена. Проверьте ваш .env и nuxt.config.ts')
}

// Создаем единственный экземпляр S3 клиента
const s3Client = new S3Client({
    endpoint: s3Config.endpoint,
    region: s3Config.region,
    credentials: {
        accessKeyId: s3Config.accessKeyId,
        secretAccessKey: s3Config.secretAccessKey,
    },
    forcePathStyle: true, // Обязательно для MinIO
})

/**
 * Загружает локальный файл в S3 (MinIO).
 * @param localPath - Путь к локальному файлу.
 * @param s3Key - Ключ (путь) объекта в S3.
 * @returns Промис, который разрешается после успешной загрузки.
 */
export async function uploadToS3(localPath: string, s3Key: string): Promise<void> {
    const fileStat = await stat(localPath)
    const fileStream = createReadStream(localPath)

    const command = new PutObjectCommand({
        Bucket: s3Config.bucket,
        Key: s3Key,
        Body: fileStream,
        ContentLength: fileStat.size,
        // ContentType можно определять с помощью `mime-types`, но для видео/аудио это не так критично
    })

    console.log(`[S3] Загрузка файла ${path.basename(localPath)} в s3://${s3Config.bucket}/${s3Key}`)
    await s3Client.send(command)
    console.log(`[S3] Файл успешно загружен.`)
}