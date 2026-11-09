import type { Buffer } from 'node:buffer'
import { randomUUID } from 'node:crypto'
import { mkdir, unlink, writeFile } from 'node:fs/promises'
import { dirname, extname, resolve, sep } from 'node:path'
import process from 'node:process'

const MIME_TO_EXT: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/webp': '.webp'
}

const EXT_TO_MIME: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp'
}

export const IMAGE_MAX_BYTES = 15 * 1024 * 1024

export function uploadRoot(): string {
  return resolve(process.env.UPLOAD_DIR || './uploads')
}

export function imageMimeFor(filename?: string, mimeType?: string): string | null {
  if (mimeType && MIME_TO_EXT[mimeType]) {
    return mimeType
  }

  const extension = extname(filename ?? '').toLowerCase()
  return EXT_TO_MIME[extension] ?? null
}

export function isImageExtension(filename: string): boolean {
  return Boolean(EXT_TO_MIME[extname(filename).toLowerCase()])
}

export function mimeForExtension(filename: string): string {
  return EXT_TO_MIME[extname(filename).toLowerCase()] ?? 'application/octet-stream'
}

export function resolveUploadPath(relativePath: string): string | null {
  const root = uploadRoot()
  const cleaned = relativePath.replace(/^[/\\]+/, '')
  const full = resolve(root, cleaned)

  if (full !== root && !full.startsWith(root + sep)) {
    return null
  }

  return full
}

export interface SavedImage {
  storagePath: string
  originalName: string
  mimeType: string
  sizeBytes: number
}

export async function saveClusterImage(
  clusterId: string,
  data: Buffer,
  filename?: string,
  mimeType?: string
): Promise<SavedImage> {
  const resolvedMime = imageMimeFor(filename, mimeType)
  if (!resolvedMime) {
    throw new Error('Unsupported image type. Use PNG, JPEG, or WebP.')
  }

  if (data.length > IMAGE_MAX_BYTES) {
    throw new Error('Image is too large (max 15 MB).')
  }

  const extension = MIME_TO_EXT[resolvedMime] ?? extname(filename ?? '').toLowerCase()
  const storedName = `${randomUUID()}${extension}`
  const storagePath = ['clusters', clusterId, storedName].join('/')
  const fullPath = resolveUploadPath(storagePath)

  if (!fullPath) {
    throw new Error('Invalid upload path.')
  }

  await mkdir(dirname(fullPath), { recursive: true })
  await writeFile(fullPath, data)

  return {
    storagePath,
    originalName: filename?.trim() || storedName,
    mimeType: resolvedMime,
    sizeBytes: data.length
  }
}

export async function deleteClusterImageFile(storagePath: string): Promise<void> {
  const fullPath = resolveUploadPath(storagePath)
  if (!fullPath) {
    return
  }

  await unlink(fullPath).catch(() => {})
}
