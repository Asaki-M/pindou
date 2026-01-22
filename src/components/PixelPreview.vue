<template>
  <div
    class="rounded-2xl border border-[#b09aa6] bg-[#e6d9e1]/70 p-5 shadow-[0_16px_40px_rgba(56,34,56,0.2)]"
  >
  <div class="flex items-center justify-between text-sm text-[#4f3b52]">
    <span>预览</span>
    <span v-if="metaInfo">{{ metaInfo }}</span>
    <span v-else-if="imageInfo">{{ imageInfo }}</span>
  </div>
    <div
      class="mt-4 flex items-center justify-center overflow-hidden rounded-xl border border-[#b09aa6] bg-[#c1aeb9]"
    >
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  imageInfo: string
  metaInfo?: string
}>()
</script>
