import { users } from '~/server/data/db';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { username, password } = body;

  if (!username || !password) {
    throw createError({ statusCode: 400, message: 'Имя пользователя и пароль обязательны' });
  }

  const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());

  // Имитируем проверку пароля
  const isPasswordCorrect = user && user.passwordHash === `hashed_${password}`;

  if (!user || !isPasswordCorrect) {
    throw createError({ statusCode: 401, message: 'Неверное имя пользователя или пароль' });
  }

  // Создаем фейковый токен. В реальности здесь была бы подпись с секретным ключом.
  const fakeJwt = `fake-jwt-token-for-user-id-${user.id}`;

  return {
    token: fakeJwt
  };
});