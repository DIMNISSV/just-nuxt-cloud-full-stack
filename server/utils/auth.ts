// server/utils/auth.ts
import jwt from 'jsonwebtoken'
import type { H3Event } from 'h3'

export interface UserContext {
  userId: number
  role: 'USER' | 'ADMIN'
}

export function getUserFromEvent(event: H3Event): UserContext | null {
  const authHeader = getHeader(event, 'Authorization')
  const config = useRuntimeConfig(event)

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7) // "Bearer ".length

  try {
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