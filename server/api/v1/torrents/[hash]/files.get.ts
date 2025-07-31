// import { transmission } from '~/server/utils/transmission'

// // Описываем структуру файла, которую возвращает transmission-promise
// interface TransmissionFile {
//     name: string;
//     length: number;
//     bytesCompleted: number;
// }

// // Описываем структуру самого торрента
// interface TransmissionTorrent {
//     id: number;
//     name: string;
//     files: TransmissionFile[];
//     status: number;
//     metadataPercentComplete: number;
//     hashString: string;
// }

// // Описываем структуру ответа от `transmission.get`
// interface TransmissionGetResponse {
//     torrents: TransmissionTorrent[];
// }


// export default defineEventHandler(async (event) => {
//     const hash = event.context.params!.hash
//     if (!hash) throw createError({ statusCode: 400, message: 'infoHash is required' })

//     try {
//         const { torrents } = await transmission.get(hash, ['files', 'name', 'status', 'metadataPercentComplete']) as TransmissionGetResponse;

//         if (!torrents || torrents.length === 0) {
//             throw createError({ statusCode: 404, message: 'Торрент не найден' })
//         }

//         const torrent = torrents[0]

//         // Проверяем, загружены ли метаданные
//         if (torrent.metadataPercentComplete < 1) {
//             return {
//                 status: 'downloading_metadata',
//                 progress: torrent.metadataPercentComplete * 100,
//                 files: []
//             }
//         }

//         return {
//             status: 'ready',
//             progress: 100,
//             name: torrent.name,
//             files: torrent.files.map((file, index) => ({
//                 index,
//                 name: file.name,
//                 // `path` в `transmission-promise` отсутствует, но `name` содержит полный путь
//                 size: file.length,
//             }))
//         }
//     } catch (e: any) {
//         console.error('[Transmission API Error]', e)
//         throw createError({ statusCode: 502, message: 'Ошибка при взаимодействии с торрент-клиентом' })
//     }
// })