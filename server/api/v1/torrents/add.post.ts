// import { transmission } from '~/server/utils/transmission'
// import { addWatchMetadataJob } from '~/server/utils/queue'

// export default defineEventHandler(async (event) => {
//     const { magnetLink } = await readBody(event)
//     if (!magnetLink) throw createError({ statusCode: 400, message: 'magnetLink is required' })

//     try {
//         // 1. Добавляем торрент и сразу запускаем его (`paused: false` по умолчанию)
//         const result = await transmission.add(magnetLink)

//         if (!result) {
//             console.error('Неожиданный ответ от Transmission:', result);
//             throw new Error('Не удалось добавить торрент в Transmission');
//         }

//         // 2. Сразу ставим задачу-сторожа в очередь, чтобы он остановил скачивание данных
//         await addWatchMetadataJob({
//             torrentId: result.id,
//             hashString: result.hashString
//         })

//         // 3. Возвращаем результат клиенту, чтобы он мог начать опрашивать /files
//         return result;
//     } catch (e: any) {
//         console.error('[Transmission API Error]', e)
//         throw createError({ statusCode: 502, message: 'Ошибка при взаимодействии с торрент-клиентом' })
//     }
// })