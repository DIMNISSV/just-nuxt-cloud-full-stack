import { Role } from '@prisma/client'
import bcrypt from 'bcrypt'
import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const { username, password } = await readBody(event)

  if (!username || !password) {
    throw createError({ statusCode: 400, message: 'Имя пользователя и пароль обязательны' })
  }

  const existingUser = await prisma.user.findUnique({ where: { username } })
  if (existingUser) {
    throw createError({ statusCode: 409, message: 'Пользователь с таким именем уже существует' })
  }

  const passwordHash = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: {
      username,
      passwordHash,
      
      role: (await prisma.user.count()) === 0 ? 'ADMIN' : 'USER',
    },
    select: { id: true, username: true, role: true }, 
  })

  return user
})