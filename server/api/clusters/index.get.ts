import { eq, sql } from 'drizzle-orm'
import { clusterResults, clusters } from '../../db/schema'

export default defineEventHandler(async () => {
  return await db
    .select({
      id: clusters.id,
      name: clusters.name,
      tidalRadiusPc: clusters.tidalRadiusPc,
      createdAt: clusters.createdAt,
      resultCount: sql<number>`count(${clusterResults.id})::int`
    })
    .from(clusters)
    .leftJoin(clusterResults, eq(clusterResults.clusterId, clusters.id))
    .groupBy(clusters.id)
    .orderBy(clusters.name)
})
