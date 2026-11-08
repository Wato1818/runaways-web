<script setup lang="ts">
import type { ClusterResult } from '~~/shared/types/clusters'

defineProps<{ result: ClusterResult }>()
</script>

<template>
  <div class="grid gap-4 p-4 md:grid-cols-2">
    <section class="border border-gray-200 rounded-lg p-4 dark:border-gray-800">
      <h3 class="mb-3 text-sm font-semibold">
        CMD
      </h3>
      <div class="min-h-64 flex items-center justify-center border border-gray-300 rounded-md border-dashed text-sm text-gray-400 dark:border-gray-700">
        CMD plot placeholder — stars {{ result.starA }} / {{ result.starB }}
      </div>
    </section>

    <section class="border border-gray-200 rounded-lg p-4 dark:border-gray-800">
      <h3 class="mb-3 text-sm font-semibold">
        Position
      </h3>
      <div class="min-h-64 flex items-center justify-center border border-gray-300 rounded-md border-dashed text-sm text-gray-400 dark:border-gray-700">
        Position plot placeholder — stars {{ result.starA }} / {{ result.starB }}
      </div>
    </section>
  </div>
</template>
