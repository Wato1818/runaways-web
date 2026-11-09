import { and, eq } from 'drizzle-orm'
import * as z from 'zod'
import { clusterImages } from '../../../../../db/schema'
import { requireAdmin } from '../../../../../utils/auth'
import { deleteClusterImageFile } from '../../../../../utils/uploads'

const idSchema = z.string().uuid()

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const parsedClusterId = idSchema.safeParse(getRouterParam(event, 'id'))
  const parsedImageId = idSchema.safeParse(getRouterParam(event, 'imageId'))

  if (!parsedClusterId.success || !parsedImageId.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid image id' })
  }

  const [image] = await db
    .select()
    .from(clusterImages)
    .where(and(
      eq(clusterImages.id, parsedImageId.data),
      eq(clusterImages.clusterId, parsedClusterId.data)
    ))

  if (!image) {
    throw createError({ statusCode: 404, statusMessage: 'Image not found' })
  }

  await db.delete(clusterImages).where(eq(clusterImages.id, image.id))
  await deleteClusterImageFile(image.storagePath)

  return { ok: true }
})
