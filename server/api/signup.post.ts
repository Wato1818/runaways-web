import { signupSchema } from '~~/shared/schemas/auth'
import { users } from '../db/schema'

export default defineEventHandler(async (event) => {
  const { username, password } = await readValidatedBody(event, signupSchema.parse)

  const existingUser = await db.query.users.findFirst({
    where: {
      username
    }
  })

  if (existingUser) {
    throw createError({
      status: 409,
      statusMessage: 'Username already taken'
    })
  }

  const hashedPassword = await hashPassword(password)

  const [newUser] = await db.insert(users).values({
    username,
    password: hashedPassword,
    role: 'user'
  }).returning()

  if (!newUser) {
    throw createError({
      status: 500,
      statusMessage: 'Failed to create user'
    })
  }

  const result = await setUserSession(event, {
    user: {
      id: newUser.id,
      name: newUser.username,
      role: newUser.role as 'user' | 'admin'
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
