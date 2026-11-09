import { eq } from 'drizzle-orm'
import * as z from 'zod'
import { clusterNameSchema } from '~~/shared/schemas/clusters'
import { clusterResults, clusters } from '../../../db/schema'
import { requireAdmin } from '../../../utils/auth'
import { parseIsochroneCsv } from '../../../utils/isochrone-csv'
import { parseResultsCsv } from '../../../utils/results-csv'

const MAX_FILE_SIZE = 10 * 1024 * 1024
const MAX_ISOCHRONE_FILE_SIZE = 20 * 1024 * 1024

export default defineEventHandler(async (event) => {
  const session = await requireAdmin(event)

  const parts = await readMultipartFormData(event)
  if (!parts?.length) {
    throw createError({ statusCode: 400, statusMessage: 'No form data received' })
  }

  const namePart = parts.find(part => part.name === 'name')
  const filePart = parts.find(part => part.name === 'file')
  const replacePart = parts.find(part => part.name === 'replace')
  const tidalRadiusPart = parts.find(part => part.name === 'tidalRadiusPc')
  const isochronePart = parts.find(part => part.name === 'isochrone')

  if (!namePart?.data || !filePart?.data) {
    throw createError({ statusCode: 400, statusMessage: 'Cluster name and CSV file are required' })
  }

  const parsedName = clusterNameSchema.safeParse(namePart.data.toString('utf8'))
  if (!parsedName.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid cluster name' })
  }

  if (filePart.data.length > MAX_FILE_SIZE) {
    throw createError({ statusCode: 413, statusMessage: 'CSV file is too large (max 10 MB)' })
  }

  let tidalRadiusPc: number | null = null
  const tidalRadiusRaw = tidalRadiusPart?.data?.toString('utf8').trim() ?? ''
  if (tidalRadiusRaw) {
    const parsedTidalRadius = z.coerce.number().finite().positive().safeParse(tidalRadiusRaw)
    if (!parsedTidalRadius.success) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid tidal radius' })
    }
    tidalRadiusPc = parsedTidalRadius.data
  }

  let isochrone: [number, number][] | null = null
  if (isochronePart?.data?.length) {
    if (isochronePart.data.length > MAX_ISOCHRONE_FILE_SIZE) {
      throw createError({ statusCode: 413, statusMessage: 'Isochrone CSV is too large (max 20 MB)' })
    }

    const parsedIsochrone = parseIsochroneCsv(isochronePart.data.toString('utf8'))
    if (parsedIsochrone.error) {
      throw createError({ statusCode: 400, statusMessage: parsedIsochrone.error })
    }
    isochrone = parsedIsochrone.points
  }

  const replace = ['true', 'on', '1'].includes(replacePart?.data?.toString('utf8').toLowerCase() ?? '')
  const { rows, errors } = parseResultsCsv(filePart.data.toString('utf8'))

  if (errors.length) {
    throw createError({
      statusCode: 400,
      statusMessage: 'CSV validation failed',
      data: { errors: errors.slice(0, 50) }
    })
  }

  if (!rows.length) {
    throw createError({ statusCode: 400, statusMessage: 'CSV contains no valid rows' })
  }

  const result = await db.transaction(async (tx) => {
    const [existing] = await tx.select().from(clusters).where(eq(clusters.name, parsedName.data))

    let clusterId: string
    let replaced = false

    if (existing) {
      if (!replace) {
        throw createError({ statusCode: 409, statusMessage: 'A cluster with this name already exists' })
      }

      clusterId = existing.id
      replaced = true

      await tx.delete(clusterResults).where(eq(clusterResults.clusterId, clusterId))
      await tx.update(clusters)
        .set({
          uploadedBy: session.user.id,
          tidalRadiusPc,
          ...(isochrone ? { isochrone } : {})
        })
        .where(eq(clusters.id, clusterId))
    }
    else {
      const [created] = await tx.insert(clusters).values({
        name: parsedName.data,
        tidalRadiusPc,
        isochrone,
        uploadedBy: session.user.id
      }).returning()

      if (!created) {
        throw createError({ statusCode: 500, statusMessage: 'Failed to create cluster' })
      }

      clusterId = created.id
    }

    const values = rows.map(row => ({ clusterId, ...row }))

    for (let index = 0; index < values.length; index += 1000) {
      await tx.insert(clusterResults).values(values.slice(index, index + 1000))
    }

    return { clusterId, replaced }
  })

  return {
    cluster: { id: result.clusterId, name: parsedName.data },
    inserted: rows.length,
    replaced: result.replaced
  }
})
