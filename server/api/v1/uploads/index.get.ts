import { uploads } from '~/server/data/db';

export default defineEventHandler((event) => {
    // Имитация получения ID пользователя из токена
    const MOCK_USER_ID = 1;

    const userUploads = uploads
        .filter(u => u.userId === MOCK_USER_ID)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // Сортируем от новых к старым

    return userUploads;
});