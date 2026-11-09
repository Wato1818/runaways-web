import { defineRelations } from 'drizzle-orm'
import * as schema from './schema'

export const relations = defineRelations(schema, r => ({
  clusters: {
    results: r.many.clusterResults({ from: r.clusters.id, to: r.clusterResults.clusterId }),
    images: r.many.clusterImages({ from: r.clusters.id, to: r.clusterImages.clusterId })
  },
  clusterResults: {
    cluster: r.one.clusters({ from: r.clusterResults.clusterId, to: r.clusters.id })
  },
  clusterImages: {
    cluster: r.one.clusters({ from: r.clusterImages.clusterId, to: r.clusters.id })
  }
}))
