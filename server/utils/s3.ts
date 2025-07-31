import { S3Client, PutObjectCommand, HeadObjectCommand, CopyObjectCommand, DeleteObjectCommand, DeleteObjectsCommand } from '@aws-sdk/client-s3'
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

/**
 * Удаляет объект из S3.
 * @param s3Key - Ключ объекта для удаления.
 * @returns Промис, который разрешается после успешного удаления.
 */
export async function deleteObject(s3Key: string): Promise<void> {
    const command = new DeleteObjectCommand({
        Bucket: BUCKET,
        Key: s3Key,
    });
    try {
        await s3Client.send(command);
        console.log(`[S3] Объект успешно удален: ${s3Key}`);
    } catch (error) {
        // Мы не хотим, чтобы ошибка удаления из S3 (например, если файла уже нет)
        // ломала весь запрос. Мы просто логируем ее.
        console.error(`[S3] Ошибка при удалении объекта ${s3Key}:`, error);
    }
}

/**
 * Массово удаляет объекты из S3. Разбивает большой массив ключей на чанки по 1000.
 * @param keys - Массив ключей S3 для удаления.
 * @returns Промис, который разрешается после успешного выполнения всех запросов на удаление.
 */
export async function deleteMultipleObjects(keys: string[]): Promise<void> {
    if (keys.length === 0) {
        return;
    }

    // S3 позволяет удалять до 1000 объектов за один запрос.
    // Разбиваем массив ключей на чанки (куски) по 1000.
    const chunks: string[][] = [];
    for (let i = 0; i < keys.length; i += 1000) {
        chunks.push(keys.slice(i, i + 1000));
    }

    try {
        // Выполняем запросы на удаление для каждого чанка
        for (const chunk of chunks) {
            const deleteCommand = new DeleteObjectsCommand({
                Bucket: BUCKET,
                Delete: {
                    Objects: chunk.map(key => ({ Key: key })),
                    Quiet: false, // Устанавливаем в false, чтобы получать отчет об ошибках, если они есть
                },
            });
            const output = await s3Client.send(deleteCommand);

            // Логируем ошибки, если они произошли при удалении отдельных объектов
            if (output.Errors && output.Errors.length > 0) {
                console.error('[S3] Ошибки при массовом удалении объектов:', output.Errors);
            }
        }
        console.log(`[S3] Запрос на массовое удаление ${keys.length} объектов отправлен.`);
    } catch (error) {
        // Логируем критическую ошибку всего запроса (например, проблемы с доступом)
        console.error('[S3] Критическая ошибка при массовом удалении:', error);
    }
}
