<script setup lang="ts">
import type { ClusterResult } from '~~/shared/types/clusters'
import { scaleLinear } from 'd3'

const props = defineProps<{
  result: ClusterResult
  rank: number
  tidalRadiusPc?: number | null
}>()

const KAPPA = 4.74047
const FOV_RADIUS_PC = 150
const AXIS_LIMIT_PC = 160
const VELOCITY_SCALE = 2
const TICK_STEP = 50

const COLORS = {
  a: '#DC143C',
  b: '#4169E1',
  fov: '#4169E1',
  tidal: '#000080'
}

const uid = useId()
const expanded = ref(false)

const size = 640
const margin = { top: 24, right: 24, bottom: 56, left: 64 }
const width = size + margin.left + margin.right
const height = size + margin.top + margin.bottom

const xScale = scaleLinear().domain([-AXIS_LIMIT_PC, AXIS_LIMIT_PC]).range([0, size])
const yScale = scaleLinear().domain([-AXIS_LIMIT_PC, AXIS_LIMIT_PC]).range([size, 0])

function sx(value: number) {
  return margin.left + xScale(value)
}

function sy(value: number) {
  return margin.top + yScale(value)
}

function velocity(pmX: number, pmY: number, distPc: number) {
  return {
    x: pmX * (distPc / 1000) * KAPPA,
    y: pmY * (distPc / 1000) * KAPPA
  }
}

const stars = computed(() => {
  const distancePc = (props.result.distAPc + props.result.distBPc) / 2

  const aVelocity = velocity(props.result.pmXA, props.result.pmYA, props.result.distAPc)
  const bVelocity = velocity(props.result.pmXB, props.result.pmYB, props.result.distBPc)

  return {
    a: {
      xPc: props.result.xRefA * distancePc,
      yPc: props.result.yRefA * distancePc,
      distPc: props.result.distAPc,
      vx: aVelocity.x,
      vy: aVelocity.y,
      vMag: Math.hypot(aVelocity.x, aVelocity.y)
    },
    b: {
      xPc: props.result.xRefB * distancePc,
      yPc: props.result.yRefB * distancePc,
      distPc: props.result.distBPc,
      vx: bVelocity.x,
      vy: bVelocity.y,
      vMag: Math.hypot(bVelocity.x, bVelocity.y)
    }
  }
})

function arrowEnd(star: { xPc: number, yPc: number, vx: number, vy: number }) {
  return {
    xPc: star.xPc + star.vx / VELOCITY_SCALE,
    yPc: star.yPc + star.vy / VELOCITY_SCALE
  }
}

const ticks = computed(() => {
  const values: number[] = []
  const start = Math.ceil(-AXIS_LIMIT_PC / TICK_STEP) * TICK_STEP
  for (let value = start; value <= AXIS_LIMIT_PC; value += TICK_STEP) {
    values.push(value)
  }
  return values
})

const pairInfo = computed(() => [
  `Pair: ${props.rank} | Score: ${props.result.criteriaScore.toFixed(2)} (${props.result.tier})`,
  `θ: ${props.result.angle.toFixed(1)}° | Δt: ${props.result.tbtDiff.toFixed(3)} Myr`,
  `VR: ${props.result.vRatio.toFixed(2)}`
])

const labelA = computed(() => [
  `v: ${stars.value.a.vMag.toFixed(1)} km/s`,
  `d: ${stars.value.a.distPc.toFixed(0)} pc`
])

const labelB = computed(() => [
  `v: ${stars.value.b.vMag.toFixed(1)} km/s`,
  `d: ${stars.value.b.distPc.toFixed(0)} pc`
])

const hasTidalRadius = computed(() =>
  typeof props.tidalRadiusPc === 'number'
  && Number.isFinite(props.tidalRadiusPc)
  && props.tidalRadiusPc > 0
)

const tidalRadiusPx = computed(() =>
  hasTidalRadius.value ? xScale(props.tidalRadiusPc!) - xScale(0) : 0
)

const legendItems = computed(() => {
  const items = [
    { type: 'circle', color: COLORS.fov, label: `FoV (${FOV_RADIUS_PC} pc)`, dashed: true },
    { type: 'circle', color: COLORS.a, label: 'Star A (single)', dashed: false },
    { type: 'square', color: COLORS.b, label: 'Star B (binary)', dashed: false },
    { type: 'cross', color: '#111827', label: 'Cluster center', dashed: false }
  ]

  if (hasTidalRadius.value) {
    items.unshift({
      type: 'circle',
      color: COLORS.tidal,
      label: `Tidal (${props.tidalRadiusPc!.toFixed(1)} pc)`,
      dashed: true
    })
  }

  return items
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
          : 'h-auto w-full max-w-2xl cursor-zoom-in'"
        role="img"
        :aria-label="`Position plot for stars ${result.starA} and ${result.starB}`"
        @click="expanded = !expanded"
      >
        <rect :x="0" :y="0" :width="width" :height="height" fill="#ffffff" />

        <defs>
          <marker
            :id="`arrow-a-${uid}`"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" :fill="COLORS.a" />
          </marker>
          <marker
            :id="`arrow-b-${uid}`"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" :fill="COLORS.b" />
          </marker>
        </defs>

        <rect
          :x="margin.left"
          :y="margin.top"
          :width="size"
          :height="size"
          fill="none"
          stroke="#d1d5db"
          stroke-width="1"
        />

        <circle
          v-if="hasTidalRadius"
          :cx="sx(0)"
          :cy="sy(0)"
          :r="tidalRadiusPx"
          fill="none"
          :stroke="COLORS.tidal"
          stroke-width="1.5"
          stroke-dasharray="6 4"
        />

        <circle
          :cx="sx(0)"
          :cy="sy(0)"
          :r="xScale(FOV_RADIUS_PC) - xScale(0)"
          fill="none"
          :stroke="COLORS.fov"
          stroke-width="1"
          stroke-dasharray="2 4"
          opacity="0.6"
        />

        <line
          :x1="sx(0) - 7"
          :y1="sy(0)"
          :x2="sx(0) + 7"
          :y2="sy(0)"
          stroke="#111827"
          stroke-width="2"
        />
        <line
          :x1="sx(0)"
          :y1="sy(0) - 7"
          :x2="sx(0)"
          :y2="sy(0) + 7"
          stroke="#111827"
          stroke-width="2"
        />

        <line
          :x1="sx(stars.a.xPc)"
          :y1="sy(stars.a.yPc)"
          :x2="sx(arrowEnd(stars.a).xPc)"
          :y2="sy(arrowEnd(stars.a).yPc)"
          :stroke="COLORS.a"
          stroke-width="2"
          opacity="0.85"
          :marker-end="`url(#arrow-a-${uid})`"
        />
        <line
          :x1="sx(stars.b.xPc)"
          :y1="sy(stars.b.yPc)"
          :x2="sx(arrowEnd(stars.b).xPc)"
          :y2="sy(arrowEnd(stars.b).yPc)"
          :stroke="COLORS.b"
          stroke-width="2"
          opacity="0.85"
          :marker-end="`url(#arrow-b-${uid})`"
        />

        <circle
          :cx="sx(stars.a.xPc)"
          :cy="sy(stars.a.yPc)"
          r="8"
          :fill="COLORS.a"
          stroke="#111827"
          stroke-width="1"
        />
        <rect
          :x="sx(stars.b.xPc) - 7"
          :y="sy(stars.b.yPc) - 7"
          width="14"
          height="14"
          :fill="COLORS.b"
          stroke="#111827"
          stroke-width="1"
        />

        <foreignObject
          :x="margin.left + 10"
          :y="margin.top + 10"
          width="250"
          height="64"
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
          :x="sx(stars.a.xPc) - 62"
          :y="sy(stars.a.yPc - 6)"
          width="124"
          height="42"
        >
          <div
            xmlns="http://www.w3.org/1999/xhtml"
            class="h-full w-full border rounded bg-white/85 px-1 py-0.5 text-center text-[10px] text-gray-900 leading-snug shadow-sm"
            :style="{ borderColor: COLORS.a }"
          >
            <div v-for="line in labelA" :key="line">
              {{ line }}
            </div>
          </div>
        </foreignObject>

        <foreignObject
          :x="sx(stars.b.xPc) - 62"
          :y="sy(stars.b.yPc - 7)"
          width="124"
          height="42"
        >
          <div
            xmlns="http://www.w3.org/1999/xhtml"
            class="h-full w-full border rounded bg-white/85 px-1 py-0.5 text-center text-[10px] text-gray-900 leading-snug shadow-sm"
            :style="{ borderColor: COLORS.b }"
          >
            <div v-for="line in labelB" :key="line">
              {{ line }}
            </div>
          </div>
        </foreignObject>

        <foreignObject
          :x="width - margin.right - 186"
          :y="margin.top + 10"
          width="176"
          height="120"
        >
          <div
            xmlns="http://www.w3.org/1999/xhtml"
            class="h-full w-full border border-gray-300 rounded bg-white/90 px-2 py-1.5 text-[14px] text-gray-900 leading-snug shadow-sm"
          >
            <div
              v-for="item in legendItems"
              :key="item.label"
              class="flex items-center gap-2"
            >
              <svg width="16" height="12" class="shrink-0" aria-hidden="true">
                <circle
                  v-if="item.type === 'circle'"
                  cx="8"
                  cy="6"
                  r="4"
                  fill="none"
                  :stroke="item.color"
                  :stroke-dasharray="item.dashed ? '2 2' : undefined"
                  stroke-width="1.5"
                />
                <rect
                  v-else-if="item.type === 'square'"
                  x="4"
                  y="2"
                  width="8"
                  height="8"
                  :fill="item.color"
                />
                <g v-else>
                  <line x1="2" y1="6" x2="14" y2="6" :stroke="item.color" stroke-width="1.5" />
                  <line x1="8" y1="1" x2="8" y2="11" :stroke="item.color" stroke-width="1.5" />
                </g>
              </svg>
              <span>{{ item.label }}</span>
            </div>
          </div>
        </foreignObject>

        <g fill="#6b7280" font-size="7">
          <g v-for="tick in ticks" :key="`x-${tick}`">
            <line
              :x1="sx(tick)"
              :y1="margin.top + size"
              :x2="sx(tick)"
              :y2="margin.top + size + 5"
              stroke="#6b7280"
              stroke-width="1"
            />
            <text
              :x="sx(tick)"
              :y="margin.top + size + 17"
              text-anchor="middle"
            >
              {{ tick }}
            </text>
          </g>
          <g v-for="tick in ticks" :key="`y-${tick}`">
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
          :x="margin.left + size / 2"
          :y="height - 12"
          text-anchor="middle"
          fill="#4b5563"
          font-size="11"
        >
          Projected X Position [pc]
        </text>
        <text
          :x="16"
          :y="margin.top + size / 2"
          text-anchor="middle"
          :transform="`rotate(-90 16 ${margin.top + size / 2})`"
          fill="#4b5563"
          font-size="11"
        >
          Projected Y Position [pc]
        </text>
      </svg>
    </div>
  </Teleport>
</template>
