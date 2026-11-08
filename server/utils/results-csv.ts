import { parse } from 'csv-parse/sync'
import { resultRowSchema, type ResultRow } from '~~/shared/schemas/clusters'

export interface CsvRowError {
  row: number
  message: string
}

export interface ParsedResultsCsv {
  rows: ResultRow[]
  errors: CsvRowError[]
}

const MAX_ROWS = 20000

const REQUIRED_FIELDS = [
  'starA',
  'starB',
  'angle',
  'tbtA',
  'tbtB',
  'tbtDiff',
  'gaiaIdA',
  'gaiaIdB',
  'distAPc',
  'distBPc',
  'xRefA',
  'yRefA',
  'xRefB',
  'yRefB',
  'pmXA',
  'pmYA',
  'pmXB',
  'pmYB',
  'gBpA',
  'gBpB',
  'gRpA',
  'gRpB',
  'vA',
  'vB',
  'vRatio',
  'criteriaScore',
  'tier'
] as const

type ResultField = typeof REQUIRED_FIELDS[number]

const HEADER_ALIASES: Record<string, ResultField> = {
  star_a: 'starA',
  star_b: 'starB',
  angle: 'angle',
  tbt_a: 'tbtA',
  tbt_b: 'tbtB',
  tbt_diff: 'tbtDiff',
  gaia_id_a: 'gaiaIdA',
  gaia_id_b: 'gaiaIdB',
  dist_a_pc: 'distAPc',
  dist_b_pc: 'distBPc',
  x_ref_a: 'xRefA',
  y_ref_a: 'yRefA',
  x_ref_b: 'xRefB',
  y_ref_b: 'yRefB',
  pm_x_a: 'pmXA',
  pm_y_a: 'pmYA',
  pm_x_b: 'pmXB',
  pm_y_b: 'pmYB',
  g_bp_a: 'gBpA',
  g_bp_b: 'gBpB',
  g_rp_a: 'gRpA',
  g_rp_b: 'gRpB',
  v_a: 'vA',
  v_b: 'vB',
  v_ratio: 'vRatio',
  criteria_score: 'criteriaScore',
  score: 'criteriaScore',
  tier: 'tier'
}

function normalizeHeader(header: string): string {
  return header
    .replace(/^\uFEFF/, '')
    .toLowerCase()
    .replace(/\[[^\]]*\]|\([^)]*\)/g, '')
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

export function parseResultsCsv(input: string): ParsedResultsCsv {
  const records = parse(input, {
    columns: true,
    bom: true,
    skip_empty_lines: true,
    trim: true
  }) as Record<string, string>[]

  if (!records.length) {
    return { rows: [], errors: [{ row: 1, message: 'CSV contains no data rows' }] }
  }

  const headerMap = new Map<ResultField, string>()
  for (const header of Object.keys(records[0]!)) {
    const field = HEADER_ALIASES[normalizeHeader(header)]
    if (field && !headerMap.has(field)) {
      headerMap.set(field, header)
    }
  }

  const missing = REQUIRED_FIELDS.filter(field => !headerMap.has(field))
  if (missing.length) {
    return { rows: [], errors: [{ row: 1, message: `Missing columns: ${missing.join(', ')}` }] }
  }

  if (records.length > MAX_ROWS) {
    return { rows: [], errors: [{ row: 1, message: `CSV has too many rows (max ${MAX_ROWS})` }] }
  }

  const rows: ResultRow[] = []
  const errors: CsvRowError[] = []
  const seen = new Set<string>()

  records.forEach((record, index) => {
    const row = index + 2
    const mapped: Record<string, string> = {}

    for (const field of REQUIRED_FIELDS) {
      mapped[field] = record[headerMap.get(field)!] ?? ''
    }

    const parsed = resultRowSchema.safeParse(mapped)
    if (!parsed.success) {
      errors.push({
        row,
        message: parsed.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join('; ')
      })
      return
    }

    const pairKey = `${parsed.data.starA}-${parsed.data.starB}`
    if (seen.has(pairKey)) {
      errors.push({ row, message: `Duplicate pair ${parsed.data.starA}/${parsed.data.starB}` })
      return
    }

    seen.add(pairKey)
    rows.push(parsed.data)
  })

  return { rows, errors }
}
