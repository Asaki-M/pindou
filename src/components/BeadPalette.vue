<template>
  <div
    class="rounded-2xl border border-[#b09aa6] bg-[#e6d9e1] p-5 shadow-[0_12px_30px_rgba(56,34,56,0.18)]"
  >
    <div class="flex items-center justify-between text-sm text-[#4f3b52]">
      <span>颜色豆子</span>
      <span v-if="palette.length">{{ palette.length }} 色</span>
    </div>
    <div class="mt-4 grid grid-cols-2 gap-3">
      <button
        v-for="color in palette"
        :key="color.hex"
        type="button"
        class="group flex items-center gap-3 rounded-xl border border-transparent bg-white/60 px-3 py-2 text-left transition hover:bg-white/80"
        :class="{
          'border-[#2b1a2b] ring-2 ring-[#2b1a2b]/30': selectedIndex === color.index,
        }"
        @click="emit('select', color.index)"
      >
        <span
          class="h-10 w-10 rounded-full border border-[#b09aa6] shadow-[inset_0_0_0_2px_rgba(255,255,255,0.6)]"
          :style="{ backgroundColor: color.hex }"
        ></span>
        <span class="text-xs text-[#4f3b52]">
          <span class="block font-semibold text-[#2b1a2b]">{{ color.name }}</span>
          <span class="block">#{{ color.hex.replace('#', '') }}</span>
          <span class="block text-[10px] text-[#6a516e]">{{ color.count }} 颗</span>
        </span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PaletteColor } from '../utils/perler'

defineProps<{
  palette: (PaletteColor & { index: number })[]
  selectedIndex: number | null
}>()

const emit = defineEmits<{
  (event: 'select', index: number): void
}>()
</script>
