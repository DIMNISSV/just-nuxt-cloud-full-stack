export default defineEventHandler((event) => {
    throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden: этот функционал вообще никому не доступен.',
    })
})