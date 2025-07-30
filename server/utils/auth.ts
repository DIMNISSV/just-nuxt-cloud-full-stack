// server/utils/auth.ts
import jwt from 'jsonwebtoken'
import type { H3Event } from 'h3'

export interface UserContext {
  userId: number
  role: 'USER' | 'ADMIN'
}

export function getUserFromEvent(event: H3Event): UserContext | null {
  const config = useRuntimeConfig(event)
  let token: string | undefined

  const authHeader = getHeader(event, 'Authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7) // "Bearer ".length
  }

  if (!token) {
    token = getCookie(event, 'auth_token')
  }

  // Если токен так и не найден, выходим
  if (!token) {
    return null
  }

  try {
    // Проверяем токен с нашим секретным ключом
    const payload = jwt.verify(token, config.jwtSecret) as UserContext & { iat: number; exp: number }
    return {
      userId: payload.userId,
      role: payload.role,
    }
  } catch (error) {
    // Невалидный токен (истек срок или неверная подпись)
    return null
  }
}