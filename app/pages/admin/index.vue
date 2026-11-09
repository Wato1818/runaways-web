<script setup lang="ts">
import type { ClusterImage, ClusterSummary, UploadResult } from '~~/shared/types/clusters'
import { prettyImageLabel } from '~~/shared/utils/image-labels'

definePageMeta({
  middleware: ['authenticated', 'is-admin']
})

const { fetch: refreshSession } = useUserSession()
const { data: clusters, refresh, pending: clustersPending } = await useFetch<ClusterSummary[]>('/api/clusters')

const name = ref('')
const tidalRadius = ref('')
const replace = ref(false)
const file = ref<File | null>(null)
const isochroneFile = ref<File | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const isochroneInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const message = ref('')
const isError = ref(false)
const errors = ref<{ row: number, message: string }[]>([])
const pendingDelete = ref<ClusterSummary | null>(null)

const imageClusterId = ref<string>()
const imageUploads = ref<{ file: File, label: string }[]>([])
const imageInput = ref<HTMLInputElement | null>(null)
const imageUploading = ref(false)
const importingImages = ref(false)
const imageMessage = ref('')
const imageIsError = ref(false)

const canUpload = computed(() => Boolean(name.value.trim()) && Boolean(file.value))
const selectedFileName = computed(() => file.value?.name ?? 'No file selected')
const selectedIsochroneFileName = computed(() => isochroneFile.value?.name ?? 'No file selected')

const clusterOptions = computed(() =>
  (clusters.value ?? []).map(cluster => ({
    label: cluster.name,
    value: cluster.id
  }))
)

watch(clusters, (value) => {
  if (!imageClusterId.value && value?.length) {
    imageClusterId.value = value[0]!.id
  }
}, { immediate: true })

const { data: clusterImages, pending: imagesPending, refresh: refreshImages } = await useAsyncData(
  'admin-cluster-images',
  () => imageClusterId.value
    ? $fetch<ClusterImage[]>(`/api/clusters/${imageClusterId.value}/images`)
    : Promise.resolve([] as ClusterImage[]),
  { watch: [imageClusterId] }
)

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

function onIsochroneChange(event: Event) {
  const input = event.target as HTMLInputElement
  isochroneFile.value = input.files?.[0] ?? null
}

function onImagesChange(event: Event) {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? [])

  imageUploads.value = files.map(file => ({
    file,
    label: prettyImageLabel(file.name)
  }))
}

function removeImageUpload(index: number) {
  imageUploads.value.splice(index, 1)
}

async function uploadImages() {
  if (!imageClusterId.value || !imageUploads.value.length) {
    return
  }

  imageUploading.value = true
  imageIsError.value = false
  imageMessage.value = ''

  try {
    for (const item of imageUploads.value) {
      const form = new FormData()
      form.append('file', item.file)
      form.append('label', item.label)

      await $fetch(`/api/admin/clusters/${imageClusterId.value}/images`, {
        method: 'POST',
        body: form
      })
    }

    const count = imageUploads.value.length
    imageMessage.value = `Uploaded ${count} image${count === 1 ? '' : 's'}.`
    imageUploads.value = []

    if (imageInput.value) {
      imageInput.value.value = ''
    }

    await refreshImages()
  }
  catch (error) {
    imageIsError.value = true
    imageMessage.value = error instanceof Error ? error.message : 'Image upload failed.'
  }
  finally {
    imageUploading.value = false
  }
}

async function importImages() {
  if (!imageClusterId.value) {
    return
  }

  importingImages.value = true
  imageIsError.value = false
  imageMessage.value = ''

  try {
    const result = await $fetch<{ imported: number, skipped: number, failed: number }>(
      `/api/admin/clusters/${imageClusterId.value}/images/import`,
      { method: 'POST' }
    )

    const skipped = result.skipped ? `, skipped ${result.skipped}` : ''
    const failed = result.failed ? `, failed ${result.failed}` : ''
    imageMessage.value = `Imported ${result.imported} image${result.imported === 1 ? '' : 's'}${skipped}${failed}.`

    await refreshImages()
  }
  catch (error) {
    imageIsError.value = true
    imageMessage.value = error instanceof Error ? error.message : 'Import failed.'
  }
  finally {
    importingImages.value = false
  }
}

async function deleteImage(image: ClusterImage) {
  if (!imageClusterId.value) {
    return
  }

  imageIsError.value = false
  imageMessage.value = ''

  try {
    await $fetch(`/api/admin/clusters/${imageClusterId.value}/images/${image.id}`, {
      method: 'DELETE'
    })
    await refreshImages()
  }
  catch (error) {
    imageIsError.value = true
    imageMessage.value = error instanceof Error ? error.message : 'Could not delete image.'
  }
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
    form.append('tidalRadiusPc', String(tidalRadius.value ?? '').trim())
    form.append('file', selectedFile)
    if (isochroneFile.value) {
      form.append('isochrone', isochroneFile.value)
    }
    form.append('replace', String(replace.value))

    const result = await $fetch<UploadResult>('/api/admin/clusters', {
      method: 'POST',
      body: form
    })

    message.value = `${result.replaced ? 'Replaced' : 'Imported'} ${result.inserted} rows for ${result.cluster.name}.`
    name.value = ''
    tidalRadius.value = ''
    replace.value = false
    file.value = null
    isochroneFile.value = null

    if (fileInput.value) {
      fileInput.value.value = ''
    }

    if (isochroneInput.value) {
      isochroneInput.value.value = ''
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
          Upload the candidate-pair results CSV and, optionally, the cluster isochrone used for the CMD bands.
        </p>
      </div>

      <form class="flex flex-col gap-4" @submit.prevent="upload">
        <label class="text-sm font-medium space-y-1">
          <span>Cluster name</span>
          <NInput v-model="name" placeholder="NGC 2682" />
        </label>

        <label class="text-sm font-medium space-y-1">
          <span>Tidal radius (pc)</span>
          <NInput v-model="tidalRadius" type="number" step="0.01" min="0" placeholder="8.71" />
        </label>

        <label class="text-sm font-medium space-y-1">
          <span>Results CSV <span class="text-red-600">*</span></span>
          <input
            ref="fileInput"
            type="file"
            accept=".csv,text/csv"
            class="block w-full text-sm text-gray-500 file:mr-4 file:border-0 file:rounded-md file:bg-gray-100 file:px-4 file:py-2 file:text-sm file:font-medium dark:file:bg-gray-800 hover:file:bg-gray-200 dark:hover:file:bg-gray-700"
            @change="onFileChange"
          >
          <span class="block text-xs text-gray-500 font-normal leading-snug">
            Candidate-pair data. Required columns: star_a, star_b, angle, tbt_a [Myr], tbt_b [Myr], tbt_diff [Myr], gaia_id_a, gaia_id_b, dist_a_pc, dist_b_pc, x_ref_a, y_ref_a, x_ref_b, y_ref_b, pm_x_a, pm_y_a, pm_x_b, pm_y_b, g_bp_a, g_bp_b, g_rp_a, g_rp_b, v_a, v_b, v_ratio, Criteria_Score, Tier.
          </span>
          <span class="block text-xs text-gray-500 font-normal">
            Selected: {{ selectedFileName }}
          </span>
        </label>

        <label class="text-sm font-medium space-y-1">
          <span>Isochrone CSV <span class="text-gray-500 font-normal">(optional)</span></span>
          <input
            ref="isochroneInput"
            type="file"
            accept=".csv,text/csv"
            class="block w-full text-sm text-gray-500 file:mr-4 file:border-0 file:rounded-md file:bg-gray-100 file:px-4 file:py-2 file:text-sm file:font-medium dark:file:bg-gray-800 hover:file:bg-gray-200 dark:hover:file:bg-gray-700"
            @change="onIsochroneChange"
          >
          <span class="block text-xs text-gray-500 font-normal leading-snug">
            Stellar isochrone used to draw the CMD line and bands. Required columns: G_BP, G_RP.
          </span>
          <span class="block text-xs text-gray-500 font-normal">
            Selected: {{ selectedIsochroneFileName }}
          </span>
        </label>

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

    <section class="space-y-4">
      <div class="space-y-1">
        <h2 class="text-lg font-semibold">
          Cluster images
        </h2>
        <p class="text-sm text-gray-500">
          Upload summary figures or import them from the runaways data folder. These appear on the results page.
        </p>
      </div>

      <div class="flex flex-wrap items-end gap-3">
        <label class="text-sm font-medium space-y-1">
          <span>Cluster</span>
          <NSelect
            v-model="imageClusterId" :items="clusterOptions" label-key="label" value-key="value"
            class="min-w-48"
          />
        </label>
        <NButton
          btn="ghost"
          label="Import from data folder"
          :loading="importingImages"
          :disabled="!imageClusterId || importingImages"
          @click="importImages"
        />
      </div>

      <div class="border border-gray-200 rounded-xl p-4 space-y-4 dark:border-gray-800">
        <label class="text-sm font-medium space-y-1">
          <span>Upload images</span>
          <input
            ref="imageInput"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            class="block w-full text-sm text-gray-500 file:mr-4 file:border-0 file:rounded-md file:bg-gray-100 file:px-4 file:py-2 file:text-sm file:font-medium dark:file:bg-gray-800 hover:file:bg-gray-200 dark:hover:file:bg-gray-700"
            @change="onImagesChange"
          >
        </label>

        <div v-if="imageUploads.length" class="space-y-2">
          <div
            v-for="(item, index) in imageUploads"
            :key="`${item.file.name}-${index}`"
            class="flex flex-wrap items-center gap-2"
          >
            <span class="max-w-56 min-w-0 truncate text-xs text-gray-500">{{ item.file.name }}</span>
            <NInput v-model="item.label" placeholder="Label" class="min-w-40 flex-1" />
            <NButton btn="ghost-red" label="Remove" @click="removeImageUpload(index)" />
          </div>
        </div>

        <div>
          <NButton
            label="Upload images"
            :loading="imageUploading"
            :disabled="!imageClusterId || !imageUploads.length || imageUploading"
            @click="uploadImages"
          />
        </div>
      </div>

      <p v-if="imageMessage" class="text-sm" :class="imageIsError ? 'text-red-600' : 'text-green-600'">
        {{ imageMessage }}
      </p>

      <p v-if="imagesPending" class="text-sm text-gray-500">
        Loading images…
      </p>
      <p v-else-if="!clusterImages?.length" class="text-sm text-gray-500">
        No images for this cluster yet.
      </p>
      <div v-else class="grid gap-4 lg:grid-cols-3 sm:grid-cols-2">
        <div
          v-for="image in clusterImages"
          :key="image.id"
          class="overflow-hidden border border-gray-200 rounded-xl dark:border-gray-800"
        >
          <img
            :src="image.url"
            :alt="image.label"
            loading="lazy"
            class="h-40 w-full bg-gray-50 object-contain dark:bg-gray-950"
          >
          <div class="flex items-center justify-between gap-2 p-3">
            <div class="min-w-0">
              <p class="truncate text-sm font-medium">
                {{ image.label }}
              </p>
              <p class="truncate text-xs text-gray-500">
                {{ image.originalName }}
              </p>
            </div>
            <NButton btn="ghost-red" label="Delete" @click="deleteImage(image)" />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
