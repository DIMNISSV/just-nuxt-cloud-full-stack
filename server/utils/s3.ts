import { S3Client, PutObjectCommand, HeadObjectCommand, CopyObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { v4 as uuidv4 } from 'uuid'

// Используем runtimeConfig, доступный в серверном контексте Nuxt
const s3Config = useRuntimeConfig().s3

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

const BUCKET = s3Config.bucket
const PRESIGNED_URL_EXPIRES_IN = 300 // Ссылка действительна 5 минут

/**
 * Генерирует pre-signed URL для загрузки файла напрямую в S3.
 * @param filename - Оригинальное имя файла.
 * @param mimeType - MIME-тип файла.
 * @returns Объект с URL для загрузки и уникальным ключом объекта в S3.
 */
export async function generateUploadUrl(filename: string, mimeType: string) {
    // Генерируем уникальный ключ для временного размещения файла
    const tempS3Key = `temp/${uuidv4()}/${filename}`

    const command = new PutObjectCommand({
        Bucket: BUCKET,
        Key: tempS3Key,
        ContentType: mimeType,
    })

    const uploadUrl = await getSignedUrl(s3Client, command, {
        expiresIn: PRESIGNED_URL_EXPIRES_IN,
    })

    return {
        uploadUrl,
        s3Key: tempS3Key,
    }
}

/**
 * Проверяет, существует ли объект в S3.
 * @param s3Key - Ключ объекта в S3.
 * @returns true, если объект существует, иначе false.
 */
export async function objectExists(s3Key: string): Promise<boolean> {
    try {
        const command = new HeadObjectCommand({
            Bucket: BUCKET,
            Key: s3Key,
        });
        await s3Client.send(command);
        return true;
    } catch (error: any) {
        if (error.name === 'NotFound') {
            return false;
        }
        throw error; // Перевыбрасываем другие ошибки
    }
}

/**
 * Перемещает объект из одного места в другое в пределах одного бакета S3.
 * Это серверная операция, которая намного эффективнее, чем скачивание и загрузка.
 * @param sourceKey - Исходный ключ объекта.
 * @param destinationKey - Ключ назначения.
 * @returns Промис, который разрешается после успешного перемещения.
 */
export async function moveObject(sourceKey: string, destinationKey: string): Promise<void> {
    // 1. Копируем объект
    const copyCommand = new CopyObjectCommand({
        Bucket: BUCKET,
        CopySource: `${BUCKET}/${sourceKey}`,
        Key: destinationKey,
    });
    await s3Client.send(copyCommand);

    // 2. Удаляем исходный объект
    const deleteCommand = new DeleteObjectCommand({
        Bucket: BUCKET,
        Key: sourceKey,
    });
    await s3Client.send(deleteCommand);
}