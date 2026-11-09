<script setup lang="ts">
import type { ClusterImage } from '~~/shared/types/clusters'

const props = defineProps<{
  images: ClusterImage[]
  clusterName: string
}>()

const lightboxIndex = ref<number | null>(null)

const currentImage = computed(() =>
  lightboxIndex.value === null ? null : props.images[lightboxIndex.value] ?? null
)

const hasPrevious = computed(() => lightboxIndex.value !== null && lightboxIndex.value > 0)
const hasNext = computed(() =>
  lightboxIndex.value !== null && lightboxIndex.value < props.images.length - 1
)

watch(() => props.images, () => {
  lightboxIndex.value = null
})

function openImage(index: number) {
  lightboxIndex.value = index
}

function closeImage() {
  lightboxIndex.value = null
}

function showPrevious() {
  if (hasPrevious.value && lightboxIndex.value !== null) {
    lightboxIndex.value -= 1
  }
}

function showNext() {
  if (hasNext.value && lightboxIndex.value !== null) {
    lightboxIndex.value += 1
  }
}

onKeyStroke('Escape', () => {
  if (lightboxIndex.value !== null) {
    closeImage()
  }
})

onKeyStroke('ArrowLeft', () => {
  if (lightboxIndex.value !== null) {
    showPrevious()
  }
})

onKeyStroke('ArrowRight', () => {
  if (lightboxIndex.value !== null) {
    showNext()
  }
})
</script>

<template>
  <section class="space-y-4">
    <div class="flex flex-wrap items-end justify-between gap-2">
      <div class="space-y-1">
        <h2 class="text-lg font-semibold">
          Cluster plots
        </h2>
        <p class="text-sm text-gray-500">
          Summary figures generated for {{ clusterName }}.
        </p>
      </div>
      <p v-if="images.length" class="text-sm text-gray-500">
        {{ images.length }} {{ images.length === 1 ? 'figure' : 'figures' }}
      </p>
    </div>

    <div
      v-if="!images.length"
      class="border border-gray-300 rounded-xl border-dashed p-6 text-sm text-gray-500 dark:border-gray-700"
    >
      No plots available for this cluster yet.
    </div>

    <div v-else class="columns-1 gap-4 sm:columns-2 xl:columns-3">
      <button
        v-for="(image, index) in images"
        :key="image.id"
        type="button"
        class="group mb-4 block w-full break-inside-avoid overflow-hidden border border-gray-200 rounded-xl bg-white text-left shadow-sm transition dark:border-gray-800 hover:border-gray-300 dark:bg-gray-900 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:border-gray-700"
        @click="openImage(index)"
      >
        <div class="relative overflow-hidden bg-gray-50 dark:bg-gray-950">
          <img
            :src="image.url"
            :alt="image.label"
            loading="lazy"
            class="h-auto w-full object-contain"
          >
          <span class="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/10">
            <span class="h-9 w-9 flex items-center justify-center rounded-full bg-white/90 text-gray-900 opacity-0 shadow transition group-hover:opacity-100">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M15 3h6v6" />
                <path d="M9 21H3v-6" />
                <path d="M21 3l-7 7" />
                <path d="M3 21l7-7" />
              </svg>
            </span>
          </span>
        </div>
        <div class="flex items-center justify-between gap-2 px-3 py-2">
          <span class="text-sm font-medium">{{ image.label }}</span>
          <span class="text-xs text-gray-500">View</span>
        </div>
      </button>
    </div>

    <Teleport to="body">
      <div
        v-if="currentImage"
        class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/85 p-4"
        role="dialog"
        aria-modal="true"
        :aria-label="currentImage.label"
        @click.self="closeImage"
      >
        <button
          type="button"
          class="absolute right-4 top-4 h-10 w-10 flex items-center justify-center rounded-full bg-white/90 text-2xl text-gray-900 leading-none shadow"
          aria-label="Close image"
          @click="closeImage"
        >
          ×
        </button>

        <button
          v-if="hasPrevious"
          type="button"
          class="absolute left-4 top-1/2 h-11 w-11 flex items-center justify-center rounded-full bg-white/80 text-2xl text-gray-900 shadow -translate-y-1/2 hover:bg-white"
          aria-label="Previous image"
          @click="showPrevious"
        >
          ‹
        </button>
        <button
          v-if="hasNext"
          type="button"
          class="absolute right-4 top-1/2 h-11 w-11 flex items-center justify-center rounded-full bg-white/80 text-2xl text-gray-900 shadow -translate-y-1/2 hover:bg-white"
          aria-label="Next image"
          @click="showNext"
        >
          ›
        </button>

        <img
          :src="currentImage.url"
          :alt="currentImage.label"
          class="max-h-[85vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
        >

        <div class="mt-3 max-w-2xl text-center text-sm text-white">
          <p class="font-medium">
            {{ currentImage.label }}
          </p>
          <p class="text-xs text-white/70">
            {{ (lightboxIndex ?? 0) + 1 }} / {{ images.length }}
          </p>
        </div>
      </div>
    </Teleport>
  </section>
</template>
