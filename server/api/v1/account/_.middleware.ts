// server/api/v1/account/_.middleware.ts
export default defineEventHandler((event) => {
    // Глобальный middleware уже должен был добавить user в контекст
    const user = event.context.user

    if (!user) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized: требуется авторизация',
        })
    }
})