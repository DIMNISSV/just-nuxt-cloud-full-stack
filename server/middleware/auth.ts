// server/middleware/auth.ts
import { getUserFromEvent } from '~/server/utils/auth'

export default defineEventHandler((event) => {
  const user = getUserFromEvent(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }

  // Добавляем информацию о пользователе в контекст запроса
  // для использования в последующих обработчиках
  event.context.user = user
})