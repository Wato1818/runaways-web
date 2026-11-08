<script setup lang="ts">
import type { ColumnDef, Table, VisibilityState } from '@tanstack/vue-table'
import type { ClusterResult, ClusterSummary } from '~~/shared/types/clusters'
import { h } from 'vue'

const { user, loggedIn, fetch: refreshSession } = useUserSession()

const { data: clusters, pending: clustersPending } = await useFetch<ClusterSummary[]>('/api/clusters')

const selectedClusterId = ref<string>()

watch(clusters, (value) => {
  if (!selectedClusterId.value && value?.length) {
    selectedClusterId.value = value[0]!.id
  }
}, { immediate: true })

const clusterOptions = computed(() =>
  (clusters.value ?? []).map(cluster => ({
    label: `${cluster.name} (${cluster.resultCount})`,
    value: cluster.id
  }))
)

const selectedCluster = computed(() =>
  (clusters.value ?? []).find(cluster => cluster.id === selectedClusterId.value)
)

const { data: results, pending: resultsPending, error: resultsError } = await useAsyncData(
  'cluster-results',
  () => selectedClusterId.value
    ? $fetch<ClusterResult[]>(`/api/clusters/${selectedClusterId.value}/results`)
    : Promise.resolve([] as ClusterResult[]),
  { watch: [selectedClusterId] }
)

const pagination = ref({ pageIndex: 0, pageSize: 10 })
const expanded = ref<Record<string, boolean>>({})

watch(results, (rows) => {
  pagination.value = { pageIndex: 0, pageSize: Math.max(rows?.length ?? 0, 10) }
}, { immediate: true })

watch(selectedClusterId, () => {
  expanded.value = {}
})

function csvValue(value: string | number) {
  const text = String(value)
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

function downloadCsv() {
  const rowsData = results.value

  if (!import.meta.client || !rowsData?.length) {
    return
  }

  const headers = [
    'star_a',
    'star_b',
    'angle',
    'tbt_a [Myr]',
    'tbt_b [Myr]',
    'tbt_diff [Myr]',
    'gaia_id_a',
    'gaia_id_b',
    'dist_a_pc',
    'dist_b_pc',
    'x_ref_a',
    'y_ref_a',
    'x_ref_b',
    'y_ref_b',
    'pm_x_a',
    'pm_y_a',
    'pm_x_b',
    'pm_y_b',
    'g_bp_a',
    'g_bp_b',
    'g_rp_a',
    'g_rp_b',
    'v_a',
    'v_b',
    'v_ratio',
    'Criteria_Score',
    'Tier'
  ]

  const rows = rowsData.map(row => [
    row.starA,
    row.starB,
    row.angle,
    row.tbtA,
    row.tbtB,
    row.tbtDiff,
    row.gaiaIdA,
    row.gaiaIdB,
    row.distAPc,
    row.distBPc,
    row.xRefA,
    row.yRefA,
    row.xRefB,
    row.yRefB,
    row.pmXA,
    row.pmYA,
    row.pmXB,
    row.pmYB,
    row.gBpA,
    row.gBpB,
    row.gRpA,
    row.gRpB,
    row.vA,
    row.vB,
    row.vRatio,
    row.criteriaScore,
    row.tier
  ])

  const csv = `\uFEFF${[headers, ...rows].map(row => row.map(csvValue).join(',')).join('\n')}\n`
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  const slug = (selectedCluster.value?.name ?? 'cluster')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'cluster'

  link.href = url
  link.download = `${slug}-results.csv`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function formatNumber(value: number, digits = 3) {
  return Number.isFinite(value) ? value.toFixed(digits) : '—'
}

function formatSmall(value: number) {
  if (!Number.isFinite(value)) {
    return '—'
  }

  return value < 0.001 ? value.toExponential(2) : value.toFixed(4)
}

function tierClass(tier: string) {
  if (tier === 'High') {
    return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
  }

  if (tier === 'Moderate') {
    return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
  }

  return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
}

const columns: ColumnDef<ClusterResult>[] = [
  {
    id: 'rank',
    header: 'Rank',
    cell: info => info.row.index + 1,
    enableSorting: false
  },
  {
    accessorKey: 'starA',
    header: 'Star A'
  },
  {
    accessorKey: 'starB',
    header: 'Star B'
  },
  {
    accessorKey: 'angle',
    header: 'Angle (°)',
    cell: info => formatNumber(info.getValue<number>(), 3)
  },
  {
    accessorKey: 'tbtA',
    header: 'TBT A (Myr)',
    cell: info => formatNumber(info.getValue<number>(), 4)
  },
  {
    accessorKey: 'tbtB',
    header: 'TBT B (Myr)',
    cell: info => formatNumber(info.getValue<number>(), 4)
  },
  {
    accessorKey: 'tbtDiff',
    header: 'TBT Diff (Myr)',
    cell: info => formatSmall(info.getValue<number>())
  },
  {
    accessorKey: 'gaiaIdA',
    header: 'Gaia ID A'
  },
  {
    accessorKey: 'gaiaIdB',
    header: 'Gaia ID B'
  },
  {
    accessorKey: 'distAPc',
    header: 'Dist A (pc)',
    cell: info => formatNumber(info.getValue<number>(), 3)
  },
  {
    accessorKey: 'distBPc',
    header: 'Dist B (pc)',
    cell: info => formatNumber(info.getValue<number>(), 3)
  },
  {
    accessorKey: 'xRefA',
    header: 'X Ref A',
    cell: info => formatSmall(info.getValue<number>())
  },
  {
    accessorKey: 'yRefA',
    header: 'Y Ref A',
    cell: info => formatSmall(info.getValue<number>())
  },
  {
    accessorKey: 'xRefB',
    header: 'X Ref B',
    cell: info => formatSmall(info.getValue<number>())
  },
  {
    accessorKey: 'yRefB',
    header: 'Y Ref B',
    cell: info => formatSmall(info.getValue<number>())
  },
  {
    accessorKey: 'pmXA',
    header: 'PM X A',
    cell: info => formatNumber(info.getValue<number>(), 3)
  },
  {
    accessorKey: 'pmYA',
    header: 'PM Y A',
    cell: info => formatNumber(info.getValue<number>(), 3)
  },
  {
    accessorKey: 'pmXB',
    header: 'PM X B',
    cell: info => formatNumber(info.getValue<number>(), 3)
  },
  {
    accessorKey: 'pmYB',
    header: 'PM Y B',
    cell: info => formatNumber(info.getValue<number>(), 3)
  },
  {
    accessorKey: 'gBpA',
    header: 'G BP A',
    cell: info => formatNumber(info.getValue<number>(), 3)
  },
  {
    accessorKey: 'gBpB',
    header: 'G BP B',
    cell: info => formatNumber(info.getValue<number>(), 3)
  },
  {
    accessorKey: 'gRpA',
    header: 'G RP A',
    cell: info => formatNumber(info.getValue<number>(), 3)
  },
  {
    accessorKey: 'gRpB',
    header: 'G RP B',
    cell: info => formatNumber(info.getValue<number>(), 3)
  },
  {
    accessorKey: 'vA',
    header: 'v A (km/s)',
    cell: info => formatNumber(info.getValue<number>(), 3)
  },
  {
    accessorKey: 'vB',
    header: 'v B (km/s)',
    cell: info => formatNumber(info.getValue<number>(), 3)
  },
  {
    accessorKey: 'vRatio',
    header: 'v Ratio',
    cell: info => formatNumber(info.getValue<number>(), 3)
  },
  {
    accessorKey: 'criteriaScore',
    header: 'Score',
    cell: info => formatNumber(info.getValue<number>(), 3)
  },
  {
    accessorKey: 'tier',
    header: 'Tier',
    cell: info => h(
      'span',
      { class: ['inline-flex rounded-full px-2 py-0.5 text-xs font-medium', tierClass(info.getValue<string>())] },
      info.getValue<string>()
    )
  }
]

const table = useTemplateRef<Table<ClusterResult>>('table')

const columnVisibility = ref<VisibilityState>({
  tbtA: false,
  tbtB: false,
  gaiaIdA: false,
  gaiaIdB: false,
  distAPc: false,
  distBPc: false,
  xRefA: false,
  yRefA: false,
  xRefB: false,
  yRefB: false,
  pmXA: false,
  pmYA: false,
  pmXB: false,
  pmYB: false,
  gBpA: false,
  gBpB: false,
  gRpA: false,
  gRpB: false,
  vA: false,
  vB: false,
  vRatio: false
})

function goTo(path: string) {
  return navigateTo(path)
}

async function logout() {
  await $fetch('/api/logout', { method: 'POST' })
  await refreshSession()
  await navigateTo('/login')
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div class="space-y-1">
        <h1 class="text-2xl font-bold">
          Cluster results
        </h1>
        <p class="text-sm text-gray-500">
          Candidate pairs sorted by criteria score.
        </p>
      </div>
      <div class="flex gap-2">
        <NButton label="Download CSV" :disabled="!results?.length" @click="downloadCsv" />
        <NButton v-if="user?.role === 'admin'" label="Manage data" @click="goTo('/admin')" />
        <NButton v-if="loggedIn" btn="ghost" label="Logout" @click="logout" />
      </div>
    </div>

    <p v-if="clustersPending" class="text-sm text-gray-500">
      Loading clusters…
    </p>
    <div
      v-else-if="!clusters?.length"
      class="border border-gray-300 rounded-xl border-dashed p-6 text-sm text-gray-500 dark:border-gray-700"
    >
      No clusters have been uploaded yet.
      <NuxtLink v-if="user?.role === 'admin'" class="underline" to="/admin">
        Upload a CSV
      </NuxtLink>
    </div>
    <template v-else>
      <NSelect
        v-model="selectedClusterId" :items="clusterOptions" label-key="label" value-key="value"
        class="max-w-xs"
      />

      <p v-if="resultsPending" class="text-sm text-gray-500">
        Loading results…
      </p>
      <p v-else-if="resultsError" class="text-sm text-red-600">
        Could not load results.
      </p>
      <template v-else>
        <div class="space-y-2">
          <p class="text-sm font-medium">
            Visible columns
          </p>
          <div class="flex flex-wrap gap-4 border-b border-gray-200 pb-4 dark:border-gray-800">
            <NCheckbox
              v-for="tableColumn in table?.getAllLeafColumns().filter(column => column.getCanHide())" :key="tableColumn.id"
              :model-value="tableColumn.getIsVisible()"
              :label="typeof tableColumn.columnDef.header === 'string' ? tableColumn.columnDef.header : tableColumn.id"
              @update:model-value="tableColumn.toggleVisibility()"
            />
          </div>
        </div>

        <NTable
          ref="table" v-model:column-visibility="columnVisibility" v-model:pagination="pagination"
          v-model:expanded="expanded"
          :columns="columns" :data="results ?? []" :_scroll-area="{
            type: 'always',
            _scrollAreaViewport: { class: 'max-h-[70vh] !overflow-y-auto' },
          }" enable-sorting enable-multi-sort
        >
          <template #expanded-header>
            <span>Plots</span>
          </template>
          <template #expanded="{ row }">
            <ResultPlots :result="row.original" />
          </template>
        </NTable>
      </template>
    </template>
  </div>
</template>
