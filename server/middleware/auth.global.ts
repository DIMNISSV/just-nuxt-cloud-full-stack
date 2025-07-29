// server/middleware/auth.global.ts
import { getUserFromEvent, UserContext } from '~/server/utils/auth'

declare module 'h3' {
    interface H3EventContext {
        user?: UserContext
    }
}

export default defineEventHandler((event) => {
    // Эта функция не выбрасывает ошибку, а просто возвращает user или null
    const user = getUserFromEvent(event)

    // Мы не блокируем запросы здесь. Мы просто обогащаем контекст.
    // Блокировка будет происходить в middleware для конкретных роутов.
    if (user) {
        event.context.user = user
    }
})