import type { ResultRow } from '../schemas/clusters'

export interface ClusterSummary {
  id: string
  name: string
  resultCount: number
  createdAt: string
}

export interface ClusterResult extends ResultRow {
  id: string
  clusterId: string
}

export interface UploadResult {
  cluster: {
    id: string
    name: string
  }
  inserted: number
  replaced: boolean
}
