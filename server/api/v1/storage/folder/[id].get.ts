import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
    const user = event.context.user
    if (!user) {
        throw createError({ statusCode: 401, message: 'Требуется авторизация' })
    }

    const folderId = event.context.params!.id === 'root'
        ? null
        : parseInt(event.context.params!.id, 10)

    if (isNaN(folderId as number) && folderId !== null) {
        throw createError({ statusCode: 400, message: 'Некорректный ID папки' })
    }

    const folders = await prisma.personalFolder.findMany({
        where: { userId: user.userId, parentId: folderId },
        orderBy: { name: 'asc' },
    })

    const filesRaw = await prisma.personalFileMeta.findMany({
        where: {
            folderId: folderId,
            asset: { userId: user.userId },
        },
        include: {
            asset: true,
        },
        orderBy: { asset: { originalFilename: 'asc' } },
    })

    const files = filesRaw.map(fileMeta => ({
        ...fileMeta,
        asset: {
            ...fileMeta.asset,
            sizeBytes: Number(fileMeta.asset.sizeBytes),
        },
    }));

    const breadcrumbs = []
    let currentFolderId = folderId
    while (currentFolderId !== null) {
        const parent = await prisma.personalFolder.findUnique({
            where: { id: currentFolderId, userId: user.userId },
            select: { id: true, name: true, parentId: true },
        })
        if (!parent) break;
        breadcrumbs.unshift({ id: parent.id, name: parent.name })
        currentFolderId = parent.parentId
    }

    return { folders, files, breadcrumbs }
})