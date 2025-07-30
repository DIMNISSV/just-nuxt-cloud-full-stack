import prisma from '~/server/utils/prisma'
// Импортируем нашу новую утилиту для работы с очередью
import { addUrlJob } from '~/server/utils/queue'

export default defineEventHandler(async (event) => {
    const { userId } = event.context.user!
    const { type, sources } = await readBody(event) as { type: string, sources: string[] }

    if (!type || !sources || !Array.isArray(sources) || sources.length === 0) {
        throw createError({ statusCode: 400, message: 'Неверный формат запроса. Требуется тип и массив источников.' })
    }

    // Prisma.createMany по умолчанию не возвращает созданные записи.
    // Чтобы получить их ID для добавления в очередь, мы создаем их в транзакции.
    const createdUploads = await prisma.$transaction(
        sources.map(source =>
            prisma.upload.create({
                data: {
                    type,
                    source,
                    // Более надежный способ извлечь имя файла из URL
                    originalFilename: source.split('/').pop()?.split('?')[0] || source,
                    userId,
                    // Статус 'NEW' установится по умолчанию, как указано в schema.prisma
                },
            })
        )
    )

    // Теперь, имея на руках созданные объекты с их ID,
    // ставим задачу в очередь для каждой новой загрузки.
    for (const upload of createdUploads) {
        // Пока что обрабатываем только тип 'url', как и запланировано в Спринте 2.
        // В будущем здесь можно будет добавить логику для торрентов.
        if (upload.type === 'url') {
            await addUrlJob({ uploadId: upload.id });
        }
    }

    // Статус 202 Accepted идеально подходит: запрос принят, но обработка еще не завершена.
    setResponseStatus(event, 202)
    return { message: `${createdUploads.length} загрузок успешно добавлены в очередь на обработку.` }
})