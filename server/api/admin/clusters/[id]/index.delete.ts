import { eq } from 'drizzle-orm'
import * as z from 'zod'
import { clusters } from '../../../../db/schema'
import { requireAdmin } from '../../../../utils/auth'

const idSchema = z.string().uuid()

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const parsedId = idSchema.safeParse(getRouterParam(event, 'id'))
  if (!parsedId.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid cluster id' })
  }

  const [deleted] = await db.delete(clusters).where(eq(clusters.id, parsedId.data)).returning({ id: clusters.id })

  if (!deleted) {
    throw createError({ statusCode: 404, statusMessage: 'Cluster not found' })
  }

  return { success: true, id: deleted.id }
})
