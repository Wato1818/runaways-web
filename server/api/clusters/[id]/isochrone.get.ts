import { eq } from 'drizzle-orm'
import * as z from 'zod'
import { clusters } from '../../../db/schema'

const idSchema = z.string().uuid()

export default defineEventHandler(async (event) => {
  const parsedId = idSchema.safeParse(getRouterParam(event, 'id'))
  if (!parsedId.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid cluster id' })
  }

  const [cluster] = await db
    .select({ isochrone: clusters.isochrone })
    .from(clusters)
    .where(eq(clusters.id, parsedId.data))

  return cluster?.isochrone ?? []
})
