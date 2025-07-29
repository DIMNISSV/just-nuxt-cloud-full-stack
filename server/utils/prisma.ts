// server/utils/prisma.ts
import { PrismaClient } from '@prisma/client'

// Предотвращаем создание множества инстансов PrismaClient в режиме разработки
declare global {
    // eslint-disable-next-line no-var
    var prisma: PrismaClient | undefined
}

const prisma = global.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
    global.prisma = prisma
}

export default prisma