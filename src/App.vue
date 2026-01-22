<template>
  <div class="min-h-screen bg-[#cdb7c2] text-[#2b1a2b]">
    <div class="mx-auto max-w-5xl px-6 py-10">
      <PixelHeader @open-game="openGame" @download-png="downloadPng" @download-svg="downloadSvg" />

      <div class="mt-8 grid gap-6 lg:grid-cols-[300px_1fr]">
        <PixelControls
          :grid-width="gridWidth"
          :grid-height="gridHeight"
          :bead-size="beadSize"
          :dither="dither"
          :merge-strength="mergeStrength"
          @update:grid-width="gridWidth = $event"
          @update:grid-height="gridHeight = $event"
          @update:bead-size="beadSize = $event"
          @update:merge-strength="mergeStrength = $event"
          @toggle-dither="dither = !dither"
          @upload="loadImage"
        />

        <PixelPreview v-show="!showGame" :image-info="imageInfo">
          <canvas ref="canvasRef" class="max-w-full"></canvas>
        </PixelPreview>
      </div>
    </div>

    <div
      v-if="showGame"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6 py-10"
    >
      <div
        class="max-h-[90vh] w-[90vw] overflow-y-auto rounded-3xl bg-[#f3eaf0] p-6"
      >
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-semibold text-[#2b1a2b]">拼豆游戏</h2>
            <p class="mt-1 text-sm text-[#4f3b52]">选色后对照预览图逐格拼豆。</p>
          </div>
          <button
            type="button"
            class="rounded-full border border-[#2b1a2b] px-4 py-2 text-sm font-semibold text-[#2b1a2b] transition hover:bg-[#2b1a2b] hover:text-[#f6edf2]"
            @click="showGame = false"
          >
            关闭
          </button>
        </div>

        <div class="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr_280px]">
          <PixelPreview :image-info="imageInfo">
            <img
              v-if="previewImageUrl"
              :src="previewImageUrl"
              alt="拼豆预览"
              class="h-auto w-full"
            />
            <div v-else class="px-6 py-12 text-sm text-[#4f3b52]">还没有预览图</div>
          </PixelPreview>

          <BeadBoard
            :width="boardWidth"
            :height="boardHeight"
            :bead-size="beadSize"
            :palette="palette"
            :board="board"
            :background="boardBackground"
            @place="placeBead"
          />

          <BeadPalette
            :palette="paletteDisplay"
            :selected-index="selectedColor"
            @select="selectedColor = $event"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import BeadBoard from './components/BeadBoard.vue'
import BeadPalette from './components/BeadPalette.vue'
import PixelControls from './components/PixelControls.vue'
import PixelHeader from './components/PixelHeader.vue'
import PixelPreview from './components/PixelPreview.vue'
import { usePerlerArt } from './composables/usePerlerArt'
import { DEFAULT_BACKGROUND_COLOR } from './utils/perler'

const {
  canvasRef,
  imageInfo,
  gridWidth,
  gridHeight,
  beadSize,
  dither,
  mergeStrength,
  palette,
  perlerData,
  loadImage,
  downloadPng,
  downloadSvg,
} = usePerlerArt()

const selectedColor = ref<number | null>(null)
const board = ref<number[]>([])
const boardBackground = DEFAULT_BACKGROUND_COLOR
const showGame = ref(false)
const previewImageUrl = ref('')

const updatePreview = () => {
  if (!canvasRef.value) return
  previewImageUrl.value = canvasRef.value.toDataURL('image/png')
}

const openGame = () => {
  updatePreview()
  showGame.value = true
}

const boardWidth = computed(() => perlerData.value?.width ?? gridWidth.value)
const boardHeight = computed(() => perlerData.value?.height ?? gridHeight.value)
const paletteDisplay = computed(() =>
  palette.value
    .map((color, index) => ({ ...color, index }))
    .filter((color) => color.count > 0)
    .sort((a, b) => b.count - a.count),
)

const resetBoard = (width: number, height: number) => {
  board.value = new Array(width * height).fill(-1)
}

const placeBead = (index: number) => {
  if (selectedColor.value === null) return
  const next = board.value.slice()
  next[index] = selectedColor.value
  board.value = next
}

watch(
  perlerData,
  (data) => {
    if (data) {
      resetBoard(data.width, data.height)
    } else {
      resetBoard(gridWidth.value, gridHeight.value)
    }
    selectedColor.value = null
    updatePreview()
  },
  { immediate: true },
)

watch(
  [gridWidth, gridHeight],
  ([width, height]) => {
    if (!perlerData.value) {
      resetBoard(width, height)
    }
  },
  { immediate: true },
)
</script>
