import { asc, eq } from 'drizzle-orm'
import * as z from 'zod'
import { clusterImages } from '../../../db/schema'

const idSchema = z.string().uuid()

export default defineEventHandler(async (event) => {
  const parsedId = idSchema.safeParse(getRouterParam(event, 'id'))
  if (!parsedId.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid cluster id' })
  }

  const images = await db
    .select()
    .from(clusterImages)
    .where(eq(clusterImages.clusterId, parsedId.data))
    .orderBy(asc(clusterImages.sortOrder), asc(clusterImages.createdAt))

  return images.map(image => ({
    id: image.id,
    url: `/uploads/${image.storagePath}`,
    label: image.label,
    originalName: image.originalName,
    sortOrder: image.sortOrder
  }))
})
