import * as z from 'zod'

export const tierSchema = z.enum(['High', 'Moderate', 'Low'])

export const clusterNameSchema = z.string().trim().min(1).max(100)

const finiteNumber = z.coerce.number().finite()

export const resultRowSchema = z.object({
  starA: z.coerce.number().int().nonnegative(),
  starB: z.coerce.number().int().nonnegative(),
  angle: finiteNumber,
  tbtA: finiteNumber,
  tbtB: finiteNumber,
  tbtDiff: finiteNumber,
  gaiaIdA: z.string().trim().min(1),
  gaiaIdB: z.string().trim().min(1),
  distAPc: finiteNumber,
  distBPc: finiteNumber,
  xRefA: finiteNumber,
  yRefA: finiteNumber,
  xRefB: finiteNumber,
  yRefB: finiteNumber,
  pmXA: finiteNumber,
  pmYA: finiteNumber,
  pmXB: finiteNumber,
  pmYB: finiteNumber,
  gBpA: finiteNumber,
  gBpB: finiteNumber,
  gRpA: finiteNumber,
  gRpB: finiteNumber,
  vA: finiteNumber,
  vB: finiteNumber,
  vRatio: finiteNumber,
  criteriaScore: finiteNumber,
  tier: tierSchema
})

export type ResultRow = z.infer<typeof resultRowSchema>
