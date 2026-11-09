import type { ResultRow } from '../schemas/clusters'

export type IsochronePoint = [color: number, mag: number]

export interface ClusterSummary {
  id: string
  name: string
  tidalRadiusPc: number | null
  resultCount: number
  createdAt: string
}

export interface ClusterResult extends ResultRow {
  id: string
  clusterId: string
}

export interface ClusterImage {
  id: string
  url: string
  label: string
  originalName: string
  sortOrder: number
}

export interface UploadResult {
  cluster: {
    id: string
    name: string
  }
  inserted: number
  replaced: boolean
}
