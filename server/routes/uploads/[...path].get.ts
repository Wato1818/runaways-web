import { readFile } from 'node:fs/promises'
import { mimeForExtension, resolveUploadPath } from '../../utils/uploads'

export default defineEventHandler(async (event) => {
  const path = getRouterParam(event, 'path')
  if (!path) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  const fullPath = resolveUploadPath(path)
  if (!fullPath) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  try {
    const data = await readFile(fullPath)
    setResponseHeader(event, 'Content-Type', mimeForExtension(fullPath))
    setResponseHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')
    return data
  }
  catch {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }
})
