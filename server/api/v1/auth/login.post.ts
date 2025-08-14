import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const { username, password } = await readBody(event)
  const config = useRuntimeConfig(event)

  if (!username || !password) {
    throw createError({ statusCode: 400, message: 'Имя пользователя и пароль обязательны' })
  }

  const user = await prisma.user.findUnique({ where: { username } })
  if (!user) {
    throw createError({ statusCode: 401, message: 'Неверное имя пользователя или пароль' })
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.passwordHash)
  if (!isPasswordCorrect) {
    throw createError({ statusCode: 401, message: 'Неверное имя пользователя или пароль' })
  }

  const token = jwt.sign(
    { userId: user.id, role: user.role },
    config.jwtSecret,
    { expiresIn: '7d' } 
  )

  return { token }
})