
export default defineEventHandler((event) => {
    
    const user = event.context.user

    if (!user || user.role !== 'ADMIN') {
        throw createError({
            statusCode: 403,
            statusMessage: 'Forbidden: доступ только для администраторов',
        })
    }
})