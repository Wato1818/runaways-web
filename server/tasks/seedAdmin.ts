import process from 'node:process'
import { eq } from 'drizzle-orm'
import { users } from '../db/schema'

export default defineTask({
  meta: {
    name: 'seedAdmin',
    description: 'Create or update the admin user'
  },

  async run() {
    const password = process.env.ADMIN_PASSWORD

    if (!password) {
      throw new Error('ADMIN_PASSWORD is not set')
    }

    const hashedPassword = await hashPassword(password)
    const [existing] = await db.select().from(users).where(eq(users.username, 'admin'))

    if (existing) {
      await db.update(users).set({ password: hashedPassword }).where(eq(users.id, existing.id))
      return { result: 'Admin user updated' }
    }

    await db.insert(users).values({
      username: 'admin',
      password: hashedPassword,
      role: 'admin'
    })

    return { result: 'Admin user created' }
  }
})
