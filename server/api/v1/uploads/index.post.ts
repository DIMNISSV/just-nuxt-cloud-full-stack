import { mediaStreams, uploads, users } from '~/server/data/db';
import type { MediaStream, Upload, UploadType } from '~/types';
import { v4 as uuidv4 } from 'uuid';

// Установите uuid: npm install uuid @types/uuid
// Мы будем использовать настоящие UUID для новых загрузок

export default defineEventHandler(async (event) => {
    // Здесь в будущем будет проверка авторизации, чтобы получить ID пользователя
    const MOCK_USER_ID = 1; // Просто заглушка
    const user = users.find(u => u.id === MOCK_USER_ID);

    const body = await readBody(event);
    const { type, sources } = body as { type: UploadType, sources: string[] };

    if (!type || !sources || !Array.isArray(sources) || sources.length === 0) {
        throw createError({ statusCode: 400, message: 'Неверный формат запроса' });
    }

    const newUploads: Upload[] = [];
    const genId = () => parseInt(`${Date.now()}${Math.round(Math.random() * 100)}`);

    for (const source of sources) {
        const newUploadUuid = uuidv4();

        const newAudioStream: MediaStream = {
            id: genId(),
            stream_type: 'audio',
            file_path: `/storage/uploads/${newUploadUuid}/audio1.mka`,
            codec_info: 'AC3',
            uploader_username: user?.username || 'unknown',
            title: `Аудио из ${source.split('/').pop()}`,
            language: 'RUS' // Можно будет добавить выбор в UI
        };
        const newVideoStream: MediaStream = {
            id: genId(),
            stream_type: 'video',
            file_path: `/storage/uploads/${newUploadUuid}/video1.mkv`,
            codec_info: 'H.265 1080p',
            uploader_username: user?.username || 'unknown',
            title: `Видео из ${source.split('/').pop()}`
        };
        mediaStreams.push(newAudioStream, newVideoStream);

        const newUpload: Upload = {
            id: genId(),
            uuid: newUploadUuid,
            status: 'new',
            type: type,
            source: source,
            original_filename: source.split('/').pop() || source,
            // Связываем потоки с загрузкой
            streams: [newAudioStream, newVideoStream],
            linked_episode_id: null,
            userId: MOCK_USER_ID,
            createdAt: new Date().toISOString(),
        };

        uploads.push(newUpload);
        newUploads.push(newUpload);
    }

    setResponseStatus(event, 202); // 202 Accepted - задача принята на обработку
    return newUploads;
});