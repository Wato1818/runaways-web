<script setup lang="ts">
import type { ClusterResult, IsochronePoint } from '~~/shared/types/clusters'

defineProps<{
  result: ClusterResult
  rank: number
  tidalRadiusPc: number | null
  isochrone: IsochronePoint[]
}>()
</script>

<template>
  <div class="grid gap-4 p-4 md:grid-cols-2">
    <section class="border border-gray-200 rounded-lg p-4 dark:border-gray-800">
      <h3 class="mb-3 text-sm font-semibold">
        CMD
      </h3>
      <CmdPlot :result="result" :rank="rank" :isochrone="isochrone" />
    </section>

    <section class="border border-gray-200 rounded-lg p-4 dark:border-gray-800">
      <h3 class="mb-3 text-sm font-semibold">
        Position
      </h3>
      <PositionPlot :result="result" :rank="rank" :tidal-radius-pc="tidalRadiusPc" />
    </section>
  </div>
</template>
