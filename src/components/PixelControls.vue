<template>
  <div
    class="space-y-5 rounded-2xl border border-[#b09aa6] bg-[#e6d9e1] p-5 shadow-[0_12px_30px_rgba(56,34,56,0.18)]"
  >
    <label class="block text-sm font-medium text-[#3b2640]" for="upload">
      选择图片
    </label>
    <input
      id="upload"
      type="file"
      accept="image/*"
      class="block w-full text-sm file:mr-4 file:rounded-xl file:border-0 file:bg-[#2b1a2b] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#f6edf2] hover:file:bg-[#1b0f1b]"
      @change="onFileChange"
    />

    <div>
      <div class="flex items-center justify-between text-sm">
        <span class="text-[#3b2640]">网格宽度</span>
        <span class="font-semibold">{{ props.gridWidth }} 格</span>
      </div>
      <input
        :value="props.gridWidth"
        type="range"
        min="16"
        max="80"
        step="2"
        class="mt-3 w-full accent-[#2b1a2b]"
        @input="onGridWidthInput"
      />
    </div>

    <div>
      <div class="flex items-center justify-between text-sm">
        <span class="text-[#3b2640]">网格高度</span>
        <span class="font-semibold">{{ props.gridHeight }} 格</span>
      </div>
      <input
        :value="props.gridHeight"
        type="range"
        min="16"
        max="80"
        step="2"
        class="mt-3 w-full accent-[#2b1a2b]"
        @input="onGridHeightInput"
      />
    </div>

    <div>
      <div class="flex items-center justify-between text-sm">
        <span class="text-[#3b2640]">拼豆尺寸</span>
        <span class="font-semibold">{{ props.beadSize }} px</span>
      </div>
      <input
        :value="props.beadSize"
        type="range"
        min="10"
        max="28"
        step="1"
        class="mt-3 w-full accent-[#2b1a2b]"
        @input="onBeadSizeInput"
      />
    </div>

    <div class="flex items-center justify-between rounded-xl border border-[#b09aa6] bg-white/60 px-4 py-3">
      <div>
        <div class="text-sm font-medium text-[#3b2640]">抖动细节</div>
        <div class="text-xs text-[#6a516e]">渐变更柔，但颗粒更明显</div>
      </div>
      <button
        type="button"
        class="rounded-full border border-[#2b1a2b] px-4 py-1 text-xs font-semibold"
        @click="emit('toggle-dither')"
      >
        {{ props.dither ? '开启' : '关闭' }}
      </button>
    </div>

    <div>
      <div class="flex items-center justify-between text-sm">
        <span class="text-[#3b2640]">相邻合并</span>
        <span class="font-semibold">{{ props.mergeStrength }} 档</span>
      </div>
      <input
        :value="props.mergeStrength"
        type="range"
        min="0"
        max="2"
        step="1"
        class="mt-3 w-full accent-[#2b1a2b]"
        @input="onMergeStrengthInput"
      />
    </div>

  </div>
</template>

<script setup lang="ts">
type Props = {
  gridWidth: number
  gridHeight: number
  beadSize: number
  dither: boolean
  mergeStrength: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (event: 'update:gridWidth', value: number): void
  (event: 'update:gridHeight', value: number): void
  (event: 'update:beadSize', value: number): void
  (event: 'update:mergeStrength', value: number): void
  (event: 'toggle-dither'): void
  (event: 'upload', value: File): void
}>()

const toNumber = (event: Event) => Number((event.target as HTMLInputElement).value)

const onGridWidthInput = (event: Event) => {
  emit('update:gridWidth', toNumber(event))
}

const onGridHeightInput = (event: Event) => {
  emit('update:gridHeight', toNumber(event))
}

const onBeadSizeInput = (event: Event) => {
  emit('update:beadSize', toNumber(event))
}

const onMergeStrengthInput = (event: Event) => {
  emit('update:mergeStrength', toNumber(event))
}

const onFileChange = (event: Event) => {
  const input = event.currentTarget as HTMLInputElement | null
  const file = input?.files?.[0]
  if (!file) return
  emit('upload', file)
}
</script>
