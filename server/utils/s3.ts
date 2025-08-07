// server/utils/s3.ts

import { S3Client, PutObjectCommand, HeadObjectCommand, CopyObjectCommand, DeleteObjectCommand, DeleteObjectsCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { v4 as uuidv4 } from 'uuid'
import { runtimeConfig } from '../../config'

const s3Config = runtimeConfig.s3

if (!s3Config.endpoint || !s3Config.accessKeyId || !s3Config.secretAccessKey || !s3Config.bucket) {
    throw new Error('Конфигурация S3 не заполнена. Проверьте ваш .env и config.ts')
}

const s3Client = new S3Client({
    endpoint: s3Config.endpoint,
    region: s3Config.region,
    credentials: {
        accessKeyId: s3Config.accessKeyId,
        secretAccessKey: s3Config.secretAccessKey,
    },
    forcePathStyle: true,
})

const BUCKET = s3Config.bucket
const PRESIGNED_URL_EXPIRES_IN = 300 // 5 минут

/**
 * Генерирует pre-signed URL для загрузки файла напрямую в S3.
 */
export async function generateUploadUrl(filename: string, mimeType: string) {
    // Кодируем имя файла перед созданием ключа
    const tempS3Key = `temp/${uuidv4()}/${encodeURIComponent(filename)}`

    const command = new PutObjectCommand({
        Bucket: BUCKET,
        Key: tempS3Key,
        ContentType: mimeType,
    })

    const uploadUrl = await getSignedUrl(s3Client, command, {
        expiresIn: PRESIGNED_URL_EXPIRES_IN,
    })

    return { uploadUrl, s3Key: tempS3Key }
}

/**
 * Проверяет, существует ли объект в S3.
 */
export async function objectExists(s3Key: string): Promise<boolean> {
    try {
        const command = new HeadObjectCommand({ Bucket: BUCKET, Key: s3Key })
        await s3Client.send(command)
        return true
    } catch (error: any) {
        if (error.name === 'NotFound') return false
        throw error
    }
}

/**
 * Перемещает объект из одного места в другое в пределах одного бакета S3.
 */
export async function moveObject(sourceKey: string, destinationKey: string): Promise<void> {
    const copyCommand = new CopyObjectCommand({
        Bucket: BUCKET,
        // Источник должен быть правильно закодирован.
        CopySource: `${BUCKET}/${encodeURIComponent(sourceKey)}`,
        Key: destinationKey,
    })
    await s3Client.send(copyCommand)

    const deleteCommand = new DeleteObjectCommand({ Bucket: BUCKET, Key: sourceKey })
    await s3Client.send(deleteCommand)
}

/**
 * Удаляет один объект из S3.
 */
export async function deleteObject(s3Key: string): Promise<void> {
    const command = new DeleteObjectCommand({ Bucket: BUCKET, Key: s3Key })
    try {
        await s3Client.send(command)
        console.log(`[S3] Объект успешно удален: ${s3Key}`)
    } catch (error) {
        console.error(`[S3] Ошибка при удалении объекта ${s3Key}:`, error)
    }
}

/**
 * Массово удаляет объекты из S3.
 */
export async function deleteMultipleObjects(keys: string[]): Promise<void> {
    if (keys.length === 0) return

    const chunks: string[][] = []
    for (let i = 0; i < keys.length; i += 1000) {
        chunks.push(keys.slice(i, i + 1000))
    }

    try {
        for (const chunk of chunks) {
            const deleteCommand = new DeleteObjectsCommand({
                Bucket: BUCKET,
                Delete: {
                    Objects: chunk.map(key => ({ Key: key })),
                    Quiet: false,
                },
            })
            const output = await s3Client.send(deleteCommand)
            if (output.Errors && output.Errors.length > 0) {
                console.error('[S3] Ошибки при массовом удалении объектов:', output.Errors)
            }
        }
        console.log(`[S3] Запрос на массовое удаление ${keys.length} объектов отправлен.`)
    } catch (error) {
        console.error('[S3] Критическая ошибка при массовом удалении:', error)
    }
}


/**
 * Генерирует pre-signed URL для скачивания объекта из S3.
 */
export async function generateDownloadUrl(s3Key: string, filename: string) {
    const command = new GetObjectCommand({
        Bucket: BUCKET,
        Key: s3Key,
        ResponseContentDisposition: `attachment; filename="${encodeURIComponent(filename)}"`
    });

    const downloadUrl = await getSignedUrl(s3Client, command, {
        expiresIn: PRESIGNED_URL_EXPIRES_IN,
    });

    return downloadUrl;
}