import { transmission } from '~/server/utils/transmission'

export default defineEventHandler(async (event) => {
    const { magnetLink } = await readBody(event)
    if (!magnetLink) throw createError({ statusCode: 400, message: 'magnetLink is required' })

    try {
        const result = await transmission.add(magnetLink, { paused: true })

        // Transmission может вернуть либо `torrent-added` либо `torrent-duplicate`
        const torrentInfo = result['torrent-added'] || result['torrent-duplicate'];
        if (!torrentInfo) throw new Error('Не удалось добавить торрент в Transmission')

        return {
            id: torrentInfo.id,
            hashString: torrentInfo.hashString, // Это наш infoHash
            name: torrentInfo.name,
        }
    } catch (e: any) {
        console.error('[Transmission API Error]', e)
        throw createError({ statusCode: 502, message: 'Ошибка при взаимодействии с торрент-клиентом' })
    }
})