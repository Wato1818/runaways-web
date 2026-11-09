<script setup lang="ts">
import type { ClusterResult, IsochronePoint } from '~~/shared/types/clusters'
import { scaleLinear } from 'd3'

const props = defineProps<{
  result: ClusterResult
  rank: number
  isochrone: IsochronePoint[]
}>()

const COLORS = {
  fast: '#DC143C',
  slow: '#4169E1'
}

const uid = useId()
const clipId = `cmd-clip-${uid}`
const expanded = ref(false)

const plotWidth = 560
const plotHeight = Math.round(plotWidth * (17 / 4) * 0.29)
const margin = { top: 24, right: 24, bottom: 56, left: 64 }
const width = plotWidth + margin.left + margin.right
const height = plotHeight + margin.top + margin.bottom

const xScale = scaleLinear().domain([0, 4]).range([0, plotWidth])
const yScale = scaleLinear().domain([6, 23]).range([0, plotHeight])

function sx(value: number) {
  return margin.left + xScale(value)
}

function sy(value: number) {
  return margin.top + yScale(value)
}

const xTicks = [0, 1, 2, 3, 4]
const yTicks = [6, 8, 10, 12, 14, 16, 18, 20, 22]

const stars = computed(() => {
  const aIsFast = props.result.vA >= props.result.vB

  const a = {
    color: props.result.gBpA - props.result.gRpA,
    mag: props.result.gBpA,
    role: aIsFast ? 'fast' : 'slow'
  }

  const b = {
    color: props.result.gBpB - props.result.gRpB,
    mag: props.result.gBpB,
    role: aIsFast ? 'slow' : 'fast'
  }

  return {
    fast: aIsFast ? a : b,
    slow: aIsFast ? b : a
  }
})

const pairInfo = computed(() => [
  `Pair: ${props.rank}`,
  `θ: ${props.result.angle.toFixed(1)}° | Δt: ${props.result.tbtDiff.toFixed(3)} Myr`,
  `VR: ${props.result.vRatio.toFixed(2)} | Score: ${props.result.criteriaScore.toFixed(2)}`,
  `Tier: ${props.result.tier}`
])

const hasIsochrone = computed(() => props.isochrone.length > 0)

const isochroneSegments = computed<IsochronePoint[][]>(() => {
  const segments: IsochronePoint[][] = []
  let current: IsochronePoint[] = []
  let previous: IsochronePoint | null = null

  for (const point of props.isochrone) {
    if (previous && (Math.abs(point[0] - previous[0]) > 0.5 || Math.abs(point[1] - previous[1]) > 0.5)) {
      if (current.length) {
        segments.push(current)
      }
      current = []
    }

    current.push(point)
    previous = point
  }

  if (current.length) {
    segments.push(current)
  }

  return segments
})

const isochronePaths = computed(() =>
  isochroneSegments.value.map(segment =>
    segment
      .map(([color, mag], index) => `${index === 0 ? 'M' : 'L'} ${sx(color)} ${sy(mag)}`)
      .join(' ')
  )
)

function bandPath(segment: IsochronePoint[], topOffset: number, bottomOffset: number) {
  if (segment.length < 2) {
    return ''
  }

  const forward = segment.map(([color, mag]) => `${sx(color)},${sy(mag + topOffset)}`)
  const backward = [...segment]
    .reverse()
    .map(([color, mag]) => `${sx(color)},${sy(mag + bottomOffset)}`)

  return `M ${forward[0]} L ${forward.slice(1).join(' L ')} L ${backward.join(' L ')} Z`
}

const mainBandPaths = computed(() =>
  isochroneSegments.value.map(segment => bandPath(segment, -0.1, 0.1))
)

const binaryBandPaths = computed(() =>
  isochroneSegments.value.map(segment => bandPath(segment, -1.5, -0.1))
)

const legendItems = computed(() => {
  const items = [
    { type: 'line', color: '#dc2626', label: 'Isochrone' },
    { type: 'band', color: '#3b82f6', label: 'Binary Sequence' },
    { type: 'dot', color: COLORS.fast, label: 'Fast (Single)' },
    { type: 'dot', color: COLORS.slow, label: 'Slow (Binary)' }
  ]

  return hasIsochrone.value ? items : items.slice(2)
})
</script>

<template>
  <Teleport to="body" :disabled="!expanded">
    <div
      :class="expanded
        ? 'fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm'
        : 'relative'"
      @click.self="expanded = false"
    >
      <button
        v-if="expanded"
        type="button"
        class="absolute right-4 top-4 z-10 h-9 w-9 flex items-center justify-center rounded-full bg-white/90 text-xl text-gray-900 leading-none shadow"
        aria-label="Close expanded plot"
        @click="expanded = false"
      >
        ×
      </button>

      <svg
        :viewBox="`0 0 ${width} ${height}`"
        :class="expanded
          ? 'h-auto max-h-[90vh] w-auto max-w-[90vw] cursor-zoom-out'
          : 'h-auto w-full max-w-xl cursor-zoom-in'"
        role="img"
        :aria-label="`CMD plot for stars ${result.starA} and ${result.starB}`"
        @click="expanded = !expanded"
      >
        <rect :x="0" :y="0" :width="width" :height="height" fill="#ffffff" />

        <defs>
          <clipPath :id="clipId">
            <rect
              :x="margin.left"
              :y="margin.top"
              :width="plotWidth"
              :height="plotHeight"
            />
          </clipPath>
        </defs>

        <rect
          :x="margin.left"
          :y="margin.top"
          :width="plotWidth"
          :height="plotHeight"
          fill="none"
          stroke="#d1d5db"
          stroke-width="1"
        />

        <g stroke="#9ca3af" stroke-width="1" stroke-dasharray="1 3" opacity="0.4">
          <line
            v-for="tick in xTicks"
            :key="`grid-x-${tick}`"
            :x1="sx(tick)"
            :y1="margin.top"
            :x2="sx(tick)"
            :y2="margin.top + plotHeight"
          />
          <line
            v-for="tick in yTicks"
            :key="`grid-y-${tick}`"
            :x1="margin.left"
            :y1="sy(tick)"
            :x2="margin.left + plotWidth"
            :y2="sy(tick)"
          />
        </g>

        <g :clip-path="`url(#${clipId})`">
          <path
            v-for="(path, index) in mainBandPaths"
            :key="`main-band-${index}`"
            :d="path"
            fill="#ef4444"
            opacity="0.15"
          />
          <path
            v-for="(path, index) in binaryBandPaths"
            :key="`binary-band-${index}`"
            :d="path"
            fill="#3b82f6"
            opacity="0.15"
          />
          <path
            v-for="(path, index) in isochronePaths"
            :key="`isochrone-${index}`"
            :d="path"
            fill="none"
            stroke="#dc2626"
            stroke-width="1.5"
          />

          <circle
            :cx="sx(stars.fast.color)"
            :cy="sy(stars.fast.mag)"
            r="7"
            :fill="COLORS.fast"
            stroke="#111827"
            stroke-width="1"
          />
          <circle
            :cx="sx(stars.slow.color)"
            :cy="sy(stars.slow.mag)"
            r="7"
            :fill="COLORS.slow"
            stroke="#111827"
            stroke-width="1"
          />
        </g>

        <foreignObject
          :x="margin.left + 10"
          :y="margin.top + 10"
          width="236"
          height="80"
        >
          <div
            xmlns="http://www.w3.org/1999/xhtml"
            class="h-full w-full border border-gray-300 rounded bg-white/90 px-2 py-1 text-[10px] text-gray-900 leading-snug shadow-sm"
          >
            <div v-for="line in pairInfo" :key="line">
              {{ line }}
            </div>
          </div>
        </foreignObject>

        <foreignObject
          :x="width - margin.right - 150"
          :y="height - margin.bottom - 94"
          width="140"
          height="84"
        >
          <div
            xmlns="http://www.w3.org/1999/xhtml"
            class="h-full w-full border border-gray-300 rounded bg-white/90 px-2 py-1 text-[11px] text-gray-900 leading-snug shadow-sm"
          >
            <div
              v-for="item in legendItems"
              :key="item.label"
              class="flex items-center gap-2"
            >
              <span
                v-if="item.type === 'dot'"
                class="inline-block h-2.5 w-2.5 border border-gray-900 rounded-full"
                :style="{ backgroundColor: item.color }"
              />
              <span
                v-else-if="item.type === 'line'"
                class="inline-block h-0.5 w-3"
                :style="{ backgroundColor: item.color }"
              />
              <span
                v-else
                class="inline-block h-2.5 w-3 rounded-sm"
                :style="{ backgroundColor: item.color, opacity: 0.35 }"
              />
              <span>{{ item.label }}</span>
            </div>
          </div>
        </foreignObject>

        <g fill="#6b7280" font-size="7">
          <g v-for="tick in xTicks" :key="`x-${tick}`">
            <line
              :x1="sx(tick)"
              :y1="margin.top + plotHeight"
              :x2="sx(tick)"
              :y2="margin.top + plotHeight + 5"
              stroke="#6b7280"
              stroke-width="1"
            />
            <text
              :x="sx(tick)"
              :y="margin.top + plotHeight + 17"
              text-anchor="middle"
            >
              {{ tick }}
            </text>
          </g>
          <g v-for="tick in yTicks" :key="`y-${tick}`">
            <line
              :x1="margin.left - 5"
              :y1="sy(tick)"
              :x2="margin.left"
              :y2="sy(tick)"
              stroke="#6b7280"
              stroke-width="1"
            />
            <text
              :x="margin.left - 9"
              :y="sy(tick)"
              text-anchor="end"
              dominant-baseline="middle"
            >
              {{ tick }}
            </text>
          </g>
        </g>

        <text
          :x="margin.left + plotWidth / 2"
          :y="height - 12"
          text-anchor="middle"
          fill="#4b5563"
          font-size="11"
        >
          G_BP − G_RP
        </text>
        <text
          :x="16"
          :y="margin.top + plotHeight / 2"
          text-anchor="middle"
          :transform="`rotate(-90 16 ${margin.top + plotHeight / 2})`"
          fill="#4b5563"
          font-size="11"
        >
          G_BP [mag]
        </text>
      </svg>
    </div>
  </Teleport>
</template>
