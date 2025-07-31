import { Worker } from 'bullmq'
import { execa } from 'execa'
import path from 'path'
import { mkdir, readdir, rm } from 'fs/promises'
import prisma from './server/utils/prisma'
import { uploadToS3 } from './worker/s3'
import { appConfig, runtimeConfig } from './config'
import { StreamType } from '@prisma/client'

// --- КОНФИГУРАЦИЯ ---
const queueName = 'url-processing'
const tempDirBase = appConfig.worker.tempDir

const connection = {
    host: runtimeConfig.redis.host,
    port: runtimeConfig.redis.port,
}

// --- ОСНОВНАЯ ЛОГИКА ВОРКЕРА ---
const worker = new Worker(
    queueName,
    async (job) => {
        const { uploadId } = job.data
        console.log(`[Worker] Начата обработка задачи для Upload ID: ${uploadId}`)

        const upload = await prisma.upload.findUnique({ where: { id: uploadId } })
        if (!upload) {
            throw new Error(`Загрузка с ID ${uploadId} не найдена в БД.`)
        }

        const tempDir = path.join(tempDirBase, upload.uuid)
        await mkdir(tempDir, { recursive: true })

        let actualDownloadedFilePath = ''

        try {
            await job.updateProgress(10)
            await prisma.upload.update({ where: { id: uploadId }, data: { status: 'DOWNLOADING' } })
            console.log(`[Worker][${uploadId}] Скачивание с ${upload.source}`)

            // --- ★ ФИНАЛЬНОЕ ИСПРАВЛЕНИЕ: Скачиваем в папку и ищем результат ---
            // Команда просто скачивает файл в указанную директорию.
            // Мы больше не полагаемся на stdout.
            await execa(
                appConfig.binaries.ytdlp,
                [
                    // Указываем путь к папке. yt-dlp сам создаст файл внутри.
                    // Флаг -P (или --paths) - более явный способ указать директорию.
                    '-P',
                    tempDir,
                    // Оставляем оригинальное имя файла и расширение
                    '-o',
                    '%(title)s.%(ext)s',
                    upload.source,
                ],
            )

            // После успешного выполнения ищем скачанный файл.
            const filesInTempDir = await readdir(tempDir)
            if (filesInTempDir.length === 0) {
                throw new Error('yt-dlp завершился, но в целевой папке нет файлов.')
            }
            // Предполагаем, что скачивается один основной файл.
            // В будущем для плейлистов логику можно будет усложнить.
            const downloadedFilename = filesInTempDir[0]
            actualDownloadedFilePath = path.join(tempDir, downloadedFilename)
            // --- КОНЕЦ ИСПРАВЛЕНИЯ ---

            console.log(`[Worker][${uploadId}] Файл скачан: ${downloadedFilename}`)
            await prisma.upload.update({
                where: { id: uploadId },
                data: { status: 'PROCESSING', originalFilename: downloadedFilename },
            })

            await job.updateProgress(50)
            console.log(`[Worker][${uploadId}] Запуск демультиплексирования для файла: ${actualDownloadedFilePath}`)

            const { stdout: ffprobeOutput } = await execa(appConfig.binaries.ffprobe, [
                '-v', 'error',
                '-show_entries', 'stream=index,codec_type,codec_name,tags',
                '-of', 'json',
                actualDownloadedFilePath,
            ]);

            const probeData = JSON.parse(ffprobeOutput);
            const streamsToCreate: { type: StreamType; filePath: string; title: string; language?: string; codecInfo?: string }[] = [];
            const ffmpegArgs = ['-i', actualDownloadedFilePath];

            for (const stream of probeData.streams) {
                const streamIndex = stream.index;
                const ext = stream.codec_type === 'subtitle' ? (stream.codec_name || 'srt') : (stream.codec_type === 'video' ? 'mkv' : 'mka');
                const outputFilename = `stream_${streamIndex}.${ext}`;
                const localStreamPath = path.join(tempDir, outputFilename);
                const s3Key = `uploads/${upload.uuid}/${outputFilename}`;

                ffmpegArgs.push('-map', `0:${streamIndex}`, '-c', 'copy', localStreamPath);

                streamsToCreate.push({
                    type: stream.codec_type.toUpperCase() as StreamType,
                    filePath: s3Key,
                    title: stream.tags?.title || `${stream.codec_type.toUpperCase()} Stream #${streamIndex}`,
                    language: stream.tags?.language,
                    codecInfo: stream.codec_name,
                });
            }

            // Проверяем, есть ли что извлекать
            if (streamsToCreate.length > 0) {
                await execa(appConfig.binaries.ffmpeg, ffmpegArgs);
                console.log(`[Worker][${uploadId}] Демультиплексирование завершено.`);
            } else {
                console.log(`[Worker][${uploadId}] В файле не найдено подходящих потоков для извлечения.`);
            }


            await job.updateProgress(80)
            for (const streamData of streamsToCreate) {
                const localPath = path.join(tempDir, path.basename(streamData.filePath));
                await uploadToS3(localPath, streamData.filePath);
                await prisma.mediaStream.create({
                    data: {
                        uploadId: upload.id,
                        ...streamData
                    }
                })
            }

            await prisma.upload.update({ where: { id: uploadId }, data: { status: 'COMPLETED', statusMessage: null } })
            await job.updateProgress(100)
            console.log(`[Worker][${uploadId}] ✅ Задача успешно завершена!`)
        }
        catch (error: any) {
            const errorMessage = error.stderr || error.message || 'Неизвестная ошибка воркера';
            console.error(`[Worker][${uploadId}] ❌ Произошла ошибка:`, errorMessage)
            await prisma.upload.update({
                where: { id: uploadId },
                data: { status: 'ERROR', statusMessage: errorMessage.substring(0, 500) },
            })
            throw error
        }
        finally {
            await rm(tempDir, { recursive: true, force: true })
            console.log(`[Worker][${uploadId}] Временная папка удалена.`)
        }
    },
    { connection },
)

worker.on('completed', job => console.log(`[Queue] Завершено: задача ${job.id} успешно выполнена.`))
worker.on('failed', (job, err) => console.error(`[Queue] Ошибка: задача ${job?.id} провалена с ошибкой: ${err.message}`))

console.log('🚀 Воркер запущен и готов принимать задачи...')

process.on('SIGINT', async () => {
    console.log('Получен сигнал SIGINT. Закрытие воркера...');
    await worker.close();
    process.exit(0);
});