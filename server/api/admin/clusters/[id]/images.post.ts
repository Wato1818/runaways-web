import { desc, eq } from 'drizzle-orm'
import * as z from 'zod'
import { prettyImageLabel } from '~~/shared/utils/image-labels'
import { clusterImages, clusters } from '../../../../db/schema'
import { requireAdmin } from '../../../../utils/auth'
import { imageMimeFor, saveClusterImage } from '../../../../utils/uploads'

const idSchema = z.string().uuid()

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const parsedId = idSchema.safeParse(getRouterParam(event, 'id'))
  if (!parsedId.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid cluster id' })
  }

  const clusterId = parsedId.data

  const [cluster] = await db
    .select({ id: clusters.id })
    .from(clusters)
    .where(eq(clusters.id, clusterId))

  if (!cluster) {
    throw createError({ statusCode: 404, statusMessage: 'Cluster not found' })
  }

  const parts = await readMultipartFormData(event)
  const filePart = parts?.find(part => part.name === 'file')
  const labelPart = parts?.find(part => part.name === 'label')

  if (!filePart?.data?.length) {
    throw createError({ statusCode: 400, statusMessage: 'Image file is required' })
  }

  if (!imageMimeFor(filePart.filename, filePart.type)) {
    throw createError({ statusCode: 400, statusMessage: 'Unsupported image type. Use PNG, JPEG, or WebP.' })
  }

  let saved
  try {
    saved = await saveClusterImage(clusterId, filePart.data, filePart.filename, filePart.type)
  }
  catch (error) {
    throw createError({
      statusCode: 400,
      statusMessage: error instanceof Error ? error.message : 'Could not save image'
    })
  }

  const [last] = await db
    .select({ sortOrder: clusterImages.sortOrder })
    .from(clusterImages)
    .where(eq(clusterImages.clusterId, clusterId))
    .orderBy(desc(clusterImages.sortOrder))
    .limit(1)

  const label = labelPart?.data?.toString('utf8').trim()
    || prettyImageLabel(saved.originalName)

  const [image] = await db.insert(clusterImages).values({
    clusterId,
    storagePath: saved.storagePath,
    originalName: saved.originalName,
    label,
    mimeType: saved.mimeType,
    sizeBytes: saved.sizeBytes,
    sortOrder: (last?.sortOrder ?? -1) + 1
  }).returning()

  if (!image) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to store image' })
  }

  return {
    id: image.id,
    url: `/uploads/${image.storagePath}`,
    label: image.label,
    originalName: image.originalName,
    sortOrder: image.sortOrder
  }
})
