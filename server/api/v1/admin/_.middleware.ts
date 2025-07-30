// server/api/v1/admin/_.middleware.ts
export default defineEventHandler((event) => {
    // Глобальный middleware уже должен был добавить user в контекст
    const user = event.context.user

    if (!user || user.role !== 'ADMIN') {
        throw createError({
            statusCode: 403,
            statusMessage: 'Forbidden: доступ только для администраторов',
        })
    }
})