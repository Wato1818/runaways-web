import { sql } from 'drizzle-orm'
import { doublePrecision, index, integer, jsonb, pgTableCreator, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'

const pgTable = pgTableCreator(name => name, 'snake_case')

const timestamps = {
  createdAt: timestamp({ mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp({ mode: 'string' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => sql`now()`)
}

export const users = pgTable('users', {
  id: uuid().defaultRandom().primaryKey(),
  username: text().unique().notNull(),
  role: text({ enum: ['user', 'admin'] }).notNull().default('user'),
  password: text().notNull(),
  ...timestamps
})

export const clusters = pgTable('clusters', {
  id: uuid().defaultRandom().primaryKey(),
  name: text().unique().notNull(),
  tidalRadiusPc: doublePrecision('tidal_radius_pc'),
  isochrone: jsonb('isochrone').$type<[number, number][]>(),
  uploadedBy: uuid().references(() => users.id, { onDelete: 'set null' }),
  ...timestamps
})

export const clusterResults = pgTable('cluster_results', {
  id: uuid().defaultRandom().primaryKey(),
  clusterId: uuid().notNull().references(() => clusters.id, { onDelete: 'cascade' }),
  starA: integer().notNull(),
  starB: integer().notNull(),
  angle: doublePrecision().notNull(),
  tbtA: doublePrecision().notNull(),
  tbtB: doublePrecision().notNull(),
  tbtDiff: doublePrecision().notNull(),
  gaiaIdA: text('gaia_id_a').notNull(),
  gaiaIdB: text('gaia_id_b').notNull(),
  distAPc: doublePrecision('dist_a_pc').notNull(),
  distBPc: doublePrecision('dist_b_pc').notNull(),
  xRefA: doublePrecision('x_ref_a').notNull(),
  yRefA: doublePrecision('y_ref_a').notNull(),
  xRefB: doublePrecision('x_ref_b').notNull(),
  yRefB: doublePrecision('y_ref_b').notNull(),
  pmXA: doublePrecision('pm_x_a').notNull(),
  pmYA: doublePrecision('pm_y_a').notNull(),
  pmXB: doublePrecision('pm_x_b').notNull(),
  pmYB: doublePrecision('pm_y_b').notNull(),
  gBpA: doublePrecision('g_bp_a').notNull(),
  gBpB: doublePrecision('g_bp_b').notNull(),
  gRpA: doublePrecision('g_rp_a').notNull(),
  gRpB: doublePrecision('g_rp_b').notNull(),
  vA: doublePrecision().notNull(),
  vB: doublePrecision().notNull(),
  vRatio: doublePrecision().notNull(),
  criteriaScore: doublePrecision().notNull(),
  tier: text({ enum: ['High', 'Moderate', 'Low'] }).notNull(),
  ...timestamps
}, t => [
  uniqueIndex('cluster_results_pair_unique').on(t.clusterId, t.starA, t.starB),
  index('cluster_results_cluster_idx').on(t.clusterId),
  index('cluster_results_score_idx').on(t.clusterId, t.criteriaScore)
])

export const clusterImages = pgTable('cluster_images', {
  id: uuid().defaultRandom().primaryKey(),
  clusterId: uuid().notNull().references(() => clusters.id, { onDelete: 'cascade' }),
  storagePath: text().notNull(),
  originalName: text().notNull(),
  label: text().notNull(),
  mimeType: text().notNull(),
  sizeBytes: integer().notNull(),
  sortOrder: integer().notNull().default(0),
  ...timestamps
}, t => [
  index('cluster_images_cluster_idx').on(t.clusterId)
])
