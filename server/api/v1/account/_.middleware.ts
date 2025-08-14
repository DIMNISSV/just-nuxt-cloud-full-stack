
export default defineEventHandler((event) => {
    
    const user = event.context.user

    if (!user) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized: требуется авторизация',
        })
    }
})