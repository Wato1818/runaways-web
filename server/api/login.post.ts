import { loginSchema } from '~~/shared/schemas/auth'

export default defineEventHandler(async (event) => {
  const { username, password } = await readValidatedBody(event, loginSchema.parse)

  const registeredUser = await db.query.users.findFirst({
    where: {
      username
    }
  })

  if (!registeredUser?.id) {
    throw createError({
      status: 401,
      statusMessage: 'Invalid credentials'
    })
  }

  const isValidPassword = await verifyPassword(registeredUser.password, password)

  if (!isValidPassword) {
    throw createError({
      status: 401,
      statusMessage: 'Invalid credentials'
    })
  }

  const result = await setUserSession(event, {
    user: {
      id: registeredUser.id,
      name: registeredUser.username,
      role: registeredUser.role as 'user' | 'admin'
    }
  }, {
    cookie: {
      secure: !import.meta.dev
    }
  })

  return {
    success: true,
    user: result.user
  }
})
