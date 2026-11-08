import { asc, desc, eq } from 'drizzle-orm'
import * as z from 'zod'
import { clusterResults } from '../../../db/schema'

const idSchema = z.string().uuid()

export default defineEventHandler(async (event) => {
  const parsedId = idSchema.safeParse(getRouterParam(event, 'id'))
  if (!parsedId.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid cluster id' })
  }

  return await db
    .select()
    .from(clusterResults)
    .where(eq(clusterResults.clusterId, parsedId.data))
    .orderBy(desc(clusterResults.criteriaScore), asc(clusterResults.starA), asc(clusterResults.starB))
})
