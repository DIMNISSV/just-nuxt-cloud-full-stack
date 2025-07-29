import { users } from '~/server/data/db';
import type { User } from '~/types';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { username, password } = body;

  if (!username || !password) {
    throw createError({ statusCode: 400, message: 'Имя пользователя и пароль обязательны' });
  }

  // Проверяем, не занято ли имя пользователя
  const existingUser = users.find(u => u.username.toLowerCase() === username.toLowerCase());
  if (existingUser) {
    throw createError({ statusCode: 409, message: 'Пользователь с таким именем уже существует' });
  }

  const newUser: User = {
    id: Date.now(),
    username: username,
    passwordHash: `hashed_${password}`, // Имитация хеширования
    role: 'user'
  };

  users.push(newUser);

  // Не возвращаем пароль
  return {
    id: newUser.id,
    username: newUser.username,
    role: newUser.role
  };
});