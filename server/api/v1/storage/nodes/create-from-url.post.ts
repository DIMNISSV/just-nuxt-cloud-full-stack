

import prisma from '~/server/utils/prisma'
import { addDownloadUrlJob } from '~/server/utils/queue'
import { NodeType, NodeStatus } from '@prisma/client'

interface CreateFromUrlPayload {
    sourceUrl: string;
    parentUuid: string | null;
}

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user) {
        throw createError({ statusCode: 401, message: 'Требуется авторизация' });
    }

    const { sourceUrl, parentUuid } = await readBody<CreateFromUrlPayload>(event);
    if (!sourceUrl) {
        throw createError({ statusCode: 400, message: 'Необходимо указать URL источника' });
    }

    let parentId: number | null = null;
    if (parentUuid) {
        const parentNode = await prisma.storageNode.findUnique({ where: { uuid: parentUuid, ownerId: user.userId } });
        if (!parentNode) {
            throw createError({ statusCode: 404, message: 'Родительская папка не найдена' });
        }
        parentId = parentNode.id;
    }

    
    let filename = 'downloaded_file';
    try {
        const url = new URL(sourceUrl);
        const pathnameParts = url.pathname.split('/');
        filename = pathnameParts.pop() || filename;
    } catch (e) {
        
    }

    
    const newNode = await prisma.storageNode.create({
        data: {
            type: NodeType.FILE,
            name: filename,
            status: NodeStatus.PENDING, 
            ownerId: user.userId,
            parentId,
            meta: { sourceUrl } 
        },
    });

    
    await addDownloadUrlJob({
        nodeUuid: newNode.uuid,
        sourceUrl: sourceUrl,
    });

    setResponseStatus(event, 202); 
    return {
        ...newNode,
        sizeBytes: null
    };
});