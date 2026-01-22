<template>
  <div class="flex flex-wrap items-end justify-between gap-3">
    <div>
      <h1 class="text-3xl font-semibold tracking-tight">拼豆像素画</h1>
      <p class="mt-2 text-sm text-[#4f3b52]">
        图片→取样→匹配调色板→拼豆渲染，输出清晰方格与圆孔效果。
      </p>
      <p class="mt-2 text-sm text-[#4f3b52]">
        建议: 图片转换后再打开游戏可获取预览以及所需的颜色
      </p>
    </div>
    <div class="flex flex-wrap gap-2">
      <button
        type="button"
        class="rounded-full border border-[#2b1a2b] px-5 py-2 text-sm font-semibold text-[#2b1a2b] transition hover:bg-[#2b1a2b] hover:text-[#f6edf2]"
        @click="emit('open-game')"
      >
        打开拼豆游戏
      </button>
      <button
        type="button"
        class="rounded-full bg-[#2b1a2b] px-5 py-2 text-sm font-semibold text-[#f6edf2] transition hover:bg-[#1b0f1b]"
        @click="emit('download-png')"
      >
        下载 PNG
      </button>
      <button
        type="button"
        class="rounded-full border border-[#2b1a2b] px-5 py-2 text-sm font-semibold text-[#2b1a2b] transition hover:bg-[#2b1a2b] hover:text-[#f6edf2]"
        @click="emit('download-svg')"
      >
        下载 SVG
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  (event: 'open-game'): void
  (event: 'download-png'): void
  (event: 'download-svg'): void
}>()
</script>
