// server/middleware/admin.ts
import { getUserFromEvent } from '~/server/utils/auth'

export default defineEventHandler((event) => {
  const user = getUserFromEvent(event)

  if (!user || user.role !== 'ADMIN') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden: Admins only',
    })
  }

  event.context.user = user
})