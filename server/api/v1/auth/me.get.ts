import { users } from '~/server/data/db';
import type { User } from '~/types';

export default defineEventHandler((event) => {
    // Имитируем проверку токена
    const authHeader = getHeader(event, 'Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw createError({ statusCode: 401, message: 'Необходима авторизация' });
    }

    // Извлекаем фейковый ID пользователя из токена
    const token = authHeader.substring(7); // "Bearer ".length
    const userIdMatch = token.match(/user-id-(\d+)/);
    if (!userIdMatch) {
        throw createError({ statusCode: 401, message: 'Невалидный токен' });
    }

    const userId = parseInt(userIdMatch[1], 10);
    const user = users.find(u => u.id === userId);

    if (!user) {
        throw createError({ statusCode: 404, message: 'Пользователь не найден' });
    }

    // Возвращаем данные пользователя без хеша пароля
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
});