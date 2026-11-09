import { readdir, readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import process from 'node:process'
import { eq } from 'drizzle-orm'
import * as z from 'zod'
import { imageSortRank, prettyImageLabel } from '~~/shared/utils/image-labels'
import { clusterImages, clusters } from '../../../../../db/schema'
import { requireAdmin } from '../../../../../utils/auth'
import { imageMimeFor, isImageExtension, saveClusterImage } from '../../../../../utils/uploads'

const idSchema = z.string().uuid()

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const parsedId = idSchema.safeParse(getRouterParam(event, 'id'))
  if (!parsedId.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid cluster id' })
  }

  const clusterId = parsedId.data

  const [cluster] = await db
    .select({ id: clusters.id, name: clusters.name })
    .from(clusters)
    .where(eq(clusters.id, clusterId))

  if (!cluster) {
    throw createError({ statusCode: 404, statusMessage: 'Cluster not found' })
  }

  const folder = cluster.name.trim().replace(/\s+/g, '_')
  const dataRoot = resolve(process.env.RUNAWAYS_DATA_DIR || '../runaways/data')
  const plotsDirectory = join(dataRoot, folder, 'plots')

  let entries
  try {
    entries = await readdir(plotsDirectory, { withFileTypes: true })
  }
  catch {
    throw createError({
      statusCode: 404,
      statusMessage: `No plots folder found at ${plotsDirectory}`
    })
  }

  const filenames = entries
    .filter(entry => entry.isFile() && isImageExtension(entry.name))
    .map(entry => entry.name)
    .sort((a, b) => imageSortRank(a) - imageSortRank(b) || a.localeCompare(b))

  if (!filenames.length) {
    throw createError({ statusCode: 404, statusMessage: 'No image files found in plots folder' })
  }

  const existing = await db
    .select({ originalName: clusterImages.originalName, sortOrder: clusterImages.sortOrder })
    .from(clusterImages)
    .where(eq(clusterImages.clusterId, clusterId))

  const existingNames = new Set(existing.map(image => image.originalName))
  let sortOrder = existing.reduce((max, image) => Math.max(max, image.sortOrder), -1) + 1

  let imported = 0
  let skipped = 0
  let failed = 0

  for (const filename of filenames) {
    if (existingNames.has(filename)) {
      skipped += 1
      continue
    }

    try {
      const data = await readFile(join(plotsDirectory, filename))
      const mimeType = imageMimeFor(filename)
      if (!mimeType) {
        failed += 1
        continue
      }

      const saved = await saveClusterImage(clusterId, data, filename, mimeType)
      await db.insert(clusterImages).values({
        clusterId,
        storagePath: saved.storagePath,
        originalName: saved.originalName,
        label: prettyImageLabel(filename),
        mimeType: saved.mimeType,
        sizeBytes: saved.sizeBytes,
        sortOrder
      })

      existingNames.add(filename)
      sortOrder += 1
      imported += 1
    }
    catch {
      failed += 1
    }
  }

  return { imported, skipped, failed }
})
