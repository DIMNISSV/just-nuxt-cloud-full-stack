// import { transmission } from '~/server/utils/transmission'
// import { addTorrentJob } from '~/server/utils/queue'
// import type { AssetType } from '@prisma/client'

// interface StartDownloadingPayload {
//     torrentId: number; // ID торрента в Transmission
//     filesWanted: { index: number, name: string }[]; // Индексы и имена файлов, которые выбрал пользователь
//     assetType: AssetType;
//     folderId?: number;
// }

// export default defineEventHandler(async (event) => {
//     const user = event.context.user
//     if (!user) throw createError({ statusCode: 401, message: 'Требуется авторизация' })

//     const hash = event.context.params!.hash
//     if (!hash) throw createError({ statusCode: 400, message: 'infoHash is required' })

//     const body = await readBody<StartDownloadingPayload>(event)
//     if (!body.torrentId || !body.filesWanted || body.filesWanted.length === 0) {
//         throw createError({ statusCode: 400, message: 'Необходимы torrentId и список выбранных файлов' })
//     }

//     try {
//         // Говорим Transmission начать качать только выбранные файлы
//         await transmission.set(body.torrentId, {
//             'files-wanted': body.filesWanted.map(f => f.index)
//         })

//         // Теперь ставим задачу в очередь для воркера, чтобы он отслеживал завершение
//         await addTorrentJob({
//             torrentId: body.torrentId,
//             hashString: hash,
//             filesToProcess: body.filesWanted, // Передаем полный объект, чтобы воркер знал и имена файлов
//             userId: user.userId,
//             assetType: body.assetType,
//             folderId: body.folderId,
//         })

//         return { message: 'Скачивание выбранных файлов начато.' }

//     } catch (e: any) {
//         console.error('[Transmission API Error]', e)
//         throw createError({ statusCode: 502, message: 'Ошибка при взаимодействии с торрент-клиентом' })
//     }
// })