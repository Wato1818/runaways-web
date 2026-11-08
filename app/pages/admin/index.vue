<script setup lang="ts">
import type { ClusterSummary, UploadResult } from '~~/shared/types/clusters'

definePageMeta({
  middleware: ['authenticated', 'is-admin']
})

const { fetch: refreshSession } = useUserSession()
const { data: clusters, refresh, pending: clustersPending } = await useFetch<ClusterSummary[]>('/api/clusters')

const name = ref('')
const replace = ref(false)
const file = ref<File | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const message = ref('')
const isError = ref(false)
const errors = ref<{ row: number, message: string }[]>([])
const pendingDelete = ref<ClusterSummary | null>(null)

const canUpload = computed(() => Boolean(name.value.trim()) && Boolean(file.value))
const selectedFileName = computed(() => file.value?.name ?? 'No file selected')

watch([name, file], () => {
  if (isError.value) {
    isError.value = false
    message.value = ''
    errors.value = []
  }
})

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  file.value = input.files?.[0] ?? null
}

async function upload() {
  const clusterName = name.value.trim()
  const selectedFile = file.value

  if (!clusterName || !selectedFile) {
    isError.value = true
    errors.value = []
    message.value = 'Enter a cluster name and choose a CSV file.'
    return
  }

  uploading.value = true
  isError.value = false
  message.value = ''
  errors.value = []

  try {
    const form = new FormData()
    form.append('name', clusterName)
    form.append('file', selectedFile)
    form.append('replace', String(replace.value))

    const result = await $fetch<UploadResult>('/api/admin/clusters', {
      method: 'POST',
      body: form
    })

    message.value = `${result.replaced ? 'Replaced' : 'Imported'} ${result.inserted} rows for ${result.cluster.name}.`
    name.value = ''
    replace.value = false
    file.value = null

    if (fileInput.value) {
      fileInput.value.value = ''
    }

    await refresh()
  }
  catch (error) {
    isError.value = true

    const fetchError = error as {
      statusCode?: number
      statusMessage?: string
      message?: string
      data?: {
        statusCode?: number
        statusMessage?: string
        message?: string
        errors?: { row: number, message: string }[]
      }
    }

    errors.value = fetchError.data?.errors ?? []

    if (fetchError.statusCode === 409 || fetchError.data?.statusCode === 409) {
      message.value = 'Cluster already exists — enable "Replace existing" or use a different name.'
    }
    else {
      message.value = fetchError.data?.message
        || fetchError.data?.statusMessage
        || fetchError.statusMessage
        || fetchError.message
        || 'Upload failed.'
    }
  }
  finally {
    uploading.value = false
  }
}

function askDelete(cluster: ClusterSummary) {
  pendingDelete.value = cluster
}

function cancelDelete() {
  pendingDelete.value = null
}

async function confirmDelete() {
  const cluster = pendingDelete.value

  if (!cluster) {
    return
  }

  try {
    await $fetch(`/api/admin/clusters/${cluster.id}`, { method: 'DELETE' })
    await refresh()
  }
  catch (error) {
    isError.value = true
    const fetchError = error as { statusMessage?: string, message?: string }
    message.value = fetchError.statusMessage || fetchError.message || 'Delete failed.'
  }
  finally {
    pendingDelete.value = null
  }
}

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
  <div class="space-y-8">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div class="space-y-1">
        <h1 class="text-2xl font-bold">
          Admin dashboard
        </h1>
        <p class="text-sm text-gray-500">
          Upload cluster result CSVs and manage existing clusters.
        </p>
      </div>
      <div class="flex gap-2">
        <NButton label="Results" @click="goTo('/')" />
        <NButton btn="ghost" label="Logout" @click="logout" />
      </div>
    </div>

    <section class="border border-gray-200 rounded-xl p-6 space-y-4 dark:border-gray-800">
      <div class="space-y-1">
        <h2 class="text-lg font-semibold">
          Upload CSV
        </h2>
        <p class="text-sm text-gray-500">
          Required columns: star_a, star_b, angle, tbt_a [Myr], tbt_b [Myr], tbt_diff [Myr], gaia_id_a, gaia_id_b, dist_a_pc, dist_b_pc, x_ref_a, y_ref_a, x_ref_b, y_ref_b, pm_x_a, pm_y_a, pm_x_b, pm_y_b, g_bp_a, g_bp_b, g_rp_a, g_rp_b, v_a, v_b, v_ratio, Criteria_Score, Tier.
        </p>
      </div>

      <form class="flex flex-col gap-4" @submit.prevent="upload">
        <label class="text-sm font-medium space-y-1">
          <span>Cluster name</span>
          <NInput v-model="name" placeholder="NGC 2682" />
        </label>

        <input
          ref="fileInput"
          type="file"
          accept=".csv,text/csv"
          class="block w-full text-sm text-gray-500 file:mr-4 file:border-0 file:rounded-md file:bg-gray-100 file:px-4 file:py-2 file:text-sm file:font-medium dark:file:bg-gray-800 hover:file:bg-gray-200 dark:hover:file:bg-gray-700"
          @change="onFileChange"
        >

        <p class="text-sm text-gray-500">
          {{ selectedFileName }}
        </p>

        <label class="flex items-center gap-2 text-sm">
          <input v-model="replace" type="checkbox">
          Replace existing cluster data with the same name
        </label>

        <div>
          <NButton
            type="submit"
            :label="uploading ? 'Uploading…' : 'Upload CSV'"
            :loading="uploading"
            :disabled="uploading || !canUpload"
          />
        </div>
      </form>

      <p v-if="message" class="text-sm" :class="isError ? 'text-red-600' : 'text-green-600'">
        {{ message }}
      </p>

      <ul v-if="errors.length" class="max-h-48 overflow-auto text-sm text-red-600 space-y-1">
        <li v-for="error in errors" :key="`${error.row}-${error.message}`">
          Row {{ error.row }}: {{ error.message }}
        </li>
      </ul>
    </section>

    <section class="space-y-4">
      <h2 class="text-lg font-semibold">
        Clusters
      </h2>

      <p v-if="clustersPending" class="text-sm text-gray-500">
        Loading…
      </p>
      <p v-else-if="!clusters?.length" class="text-sm text-gray-500">
        No clusters uploaded yet.
      </p>
      <div v-else class="border border-gray-200 rounded-xl divide-y divide-gray-200 dark:border-gray-800 dark:divide-gray-800">
        <div v-for="cluster in clusters" :key="cluster.id" class="flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <p class="font-medium">
              {{ cluster.name }}
            </p>
            <p class="text-sm text-gray-500">
              {{ cluster.resultCount }} rows
            </p>
          </div>
          <div v-if="pendingDelete?.id === cluster.id" class="flex gap-2">
            <NButton btn="ghost-red" label="Confirm" @click="confirmDelete" />
            <NButton btn="ghost" label="Cancel" @click="cancelDelete" />
          </div>
          <NButton v-else btn="ghost-red" label="Delete" @click="askDelete(cluster)" />
        </div>
      </div>
    </section>
  </div>
</template>
