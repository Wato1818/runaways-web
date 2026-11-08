import type { H3Event } from 'h3'

interface SessionUser {
  role?: string | string[]
}

export function checkPermissions(user: SessionUser | null | undefined, ...requiredRoles: string[]): boolean {
  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized - No user session found'
    })
  }

  const userRoles = Array.isArray(user.role) ? user.role : [user.role]

  const hasPermission = requiredRoles.some(role => userRoles.includes(role))

  if (!hasPermission) {
    throw createError({
      statusCode: 401,
      message: `Unauthorized - Required role: ${requiredRoles.join(' or ')}`
    })
  }

  return true
}

export async function requireAdmin(event: H3Event) {
  const session = await requireUserSession(event)

  if (session.user.role !== 'admin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Admin access required'
    })
  }

  return session
}
