import type { IsochronePoint } from '~~/shared/types/clusters'
import { parse } from 'csv-parse/sync'

export interface ParsedIsochroneCsv {
  points: IsochronePoint[]
  error: string | null
}

const MAX_ROWS = 200000
const MAX_POINTS = 3000

function normalizeHeader(header: string): string {
  return header
    .replace(/^\uFEFF/, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

export function parseIsochroneCsv(input: string): ParsedIsochroneCsv {
  const records = parse(input, {
    columns: true,
    bom: true,
    skip_empty_lines: true,
    trim: true
  }) as Record<string, string>[]

  if (!records.length) {
    return { points: [], error: 'Isochrone CSV contains no data rows' }
  }

  if (records.length > MAX_ROWS) {
    return { points: [], error: `Isochrone CSV has too many rows (max ${MAX_ROWS})` }
  }

  const headerMap = new Map<string, string>()
  for (const header of Object.keys(records[0]!)) {
    const normalized = normalizeHeader(header)
    if (!headerMap.has(normalized)) {
      headerMap.set(normalized, header)
    }
  }

  const bpHeader = headerMap.get('g_bp')
  const rpHeader = headerMap.get('g_rp')
  if (!bpHeader || !rpHeader) {
    return { points: [], error: 'Missing columns: G_BP, G_RP' }
  }

  const raw: IsochronePoint[] = []
  for (const record of records) {
    const bp = Number(record[bpHeader])
    const rp = Number(record[rpHeader])

    if (!Number.isFinite(bp) || !Number.isFinite(rp)) {
      continue
    }

    raw.push([bp - rp, bp])
  }

  if (!raw.length) {
    return { points: [], error: 'Isochrone CSV contains no valid rows' }
  }

  // Keep the original file order: the rows are ordered along the evolutionary
  // track, and sorting by colour would produce a zig-zag between branches.
  const step = Math.max(1, Math.ceil(raw.length / MAX_POINTS))
  const points: IsochronePoint[] = []
  for (let index = 0; index < raw.length; index += step) {
    points.push(raw[index]!)
  }

  if (points[points.length - 1] !== raw[raw.length - 1]) {
    points.push(raw[raw.length - 1]!)
  }

  return { points, error: null }
}
