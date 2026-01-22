<template>
  <div
    class="rounded-2xl border border-[#b09aa6] bg-[#e6d9e1]/70 p-5 shadow-[0_16px_40px_rgba(56,34,56,0.2)]"
  >
    <div class="flex items-center justify-between text-sm text-[#4f3b52]">
      <span>拼豆板</span>
      <span>{{ width }} x {{ height }}</span>
    </div>
    <div
      class="relative mt-4 flex items-center justify-center overflow-hidden rounded-xl border border-[#b09aa6] bg-[#c1aeb9]"
    >
      <canvas
        ref="boardRef"
        class="h-auto w-full cursor-crosshair"
        @click="onClick"
        @mousemove="onMove"
        @mouseleave="onLeave"
      ></canvas>
      <div
        v-if="hoverInfo"
        class="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-[#2b1a2b] shadow"
      >
        {{ hoverInfo }}
      </div>
    </div>
    <p class="mt-3 text-xs text-[#6a516e]">
      悬停看行列与颜色，点击放置拼豆。
    </p>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { renderBoard, type PaletteColor } from '../utils/perler'

type Props = {
  width: number
  height: number
  beadSize: number
  palette: PaletteColor[]
  board: number[]
  background: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (event: 'place', index: number): void
}>()

const boardRef = ref<HTMLCanvasElement | null>(null)
const hoverInfo = ref<string | null>(null)

const render = () => {
  if (!boardRef.value || props.width <= 0 || props.height <= 0) return
  renderBoard(
    boardRef.value,
    props.width,
    props.height,
    props.beadSize,
    props.palette,
    props.board,
    props.background,
  )
}

const onClick = (event: MouseEvent) => {
  if (!boardRef.value) return
  const rect = boardRef.value.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  const cellSize = rect.width / props.width
  const cellX = Math.floor(x / cellSize)
  const cellY = Math.floor(y / cellSize)
  if (cellX < 0 || cellY < 0 || cellX >= props.width || cellY >= props.height) return
  emit('place', cellY * props.width + cellX)
}

const onMove = (event: MouseEvent) => {
  if (!boardRef.value) return
  const rect = boardRef.value.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  const cellSize = rect.width / props.width
  const cellX = Math.floor(x / cellSize)
  const cellY = Math.floor(y / cellSize)
  if (cellX < 0 || cellY < 0 || cellX >= props.width || cellY >= props.height) {
    hoverInfo.value = null
    return
  }
  const index = cellY * props.width + cellX
  const colorIndex = props.board[index] ?? -1
  const color = colorIndex >= 0 ? props.palette[colorIndex] : null
  const name = color?.name ?? '空'
  const hex = color?.hex ?? ''
  hoverInfo.value = `${cellY + 1}行 ${cellX + 1}列 ${name}${hex ? ` ${hex}` : ''}`
}

const onLeave = () => {
  hoverInfo.value = null
}

watch(
  () => [props.width, props.height, props.beadSize, props.palette, props.board, props.background],
  () => render(),
  { deep: true },
)

onMounted(() => {
  render()
})
</script>
