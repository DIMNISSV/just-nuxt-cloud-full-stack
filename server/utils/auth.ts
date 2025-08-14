
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
    token = authHeader.substring(7) 
  }

  if (!token) {
    token = getCookie(event, 'auth_token')
  }

  
  if (!token) {
    return null
  }

  try {
    
    const payload = jwt.verify(token, config.jwtSecret) as UserContext & { iat: number; exp: number }
    return {
      userId: payload.userId,
      role: payload.role,
    }
  } catch (error) {
    
    return null
  }
}