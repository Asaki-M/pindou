import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  buildPerlerData,
  buildPerlerSvg,
  DEFAULT_BACKGROUND_COLOR,
  DEFAULT_PALETTE,
  renderBeads,
  type PaletteColor,
  type PerlerResult,
} from '../utils/perler'

export const usePerlerArt = () => {
  const canvasRef = ref<HTMLCanvasElement | null>(null)
  const image = ref<HTMLImageElement | null>(null)
  const imageInfo = ref('')
  const gridWidth = ref(32)
  const gridHeight = ref(32)
  const beadSize = ref(18)
  const dither = ref(true)
  const mergeStrength = ref(1)
  const palette = ref<PaletteColor[]>([])
  const paletteBase = ref(DEFAULT_PALETTE)
  const background = ref(DEFAULT_BACKGROUND_COLOR)
  const objectUrl = ref<string | null>(null)
  const lastResult = ref<PerlerResult | null>(null)

  const drawPerler = () => {
    const canvas = canvasRef.value
    const sourceImage = image.value
    if (!canvas || !sourceImage) return

    const result = buildPerlerData({
      image: sourceImage,
      gridWidth: gridWidth.value,
      gridHeight: gridHeight.value,
      palette: paletteBase.value,
      dither: dither.value,
      mergeStrength: mergeStrength.value,
      background: background.value,
    })

    palette.value = result.palette
    lastResult.value = result

    renderBeads(canvas, result, beadSize.value, background.value)
  }

  const loadImage = (file: File) => {
    if (objectUrl.value) {
      URL.revokeObjectURL(objectUrl.value)
    }
    objectUrl.value = URL.createObjectURL(file)

    const img = new Image()
    img.onload = () => {
      image.value = img
      imageInfo.value = `${img.width} x ${img.height}`
      drawPerler()
    }
    img.src = objectUrl.value
  }

  const downloadPng = () => {
    if (!canvasRef.value) return
    const link = document.createElement('a')
    link.download = 'perler.png'
    link.href = canvasRef.value.toDataURL('image/png')
    link.click()
  }

  const downloadSvg = () => {
    if (!lastResult.value) return
    const svg = buildPerlerSvg(lastResult.value, beadSize.value, background.value)
    const blob = new Blob([svg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = 'perler.svg'
    link.href = url
    link.click()
    URL.revokeObjectURL(url)
  }

  watch([gridWidth, gridHeight, beadSize, dither, mergeStrength], () => {
    drawPerler()
  })

  onMounted(() => {
    if (canvasRef.value) {
      canvasRef.value.width = gridWidth.value * beadSize.value
      canvasRef.value.height = gridHeight.value * beadSize.value
    }
  })

  onBeforeUnmount(() => {
    if (objectUrl.value) {
      URL.revokeObjectURL(objectUrl.value)
    }
  })

  return {
    canvasRef,
    imageInfo,
    gridWidth,
    gridHeight,
    beadSize,
    dither,
    mergeStrength,
    palette,
    perlerData: lastResult,
    loadImage,
    downloadPng,
    downloadSvg,
  }
}
