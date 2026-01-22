const DEFAULT_BACKGROUND = '#cdb7c2'

export type PaletteColor = {
  name: string
  hex: string
  r: number
  g: number
  b: number
  l: number
  a: number
  b2: number
  count: number
}

export type PerlerOptions = {
  image: HTMLImageElement
  gridWidth: number
  gridHeight: number
  palette: PaletteColor[]
  dither: boolean
  mergeStrength: number
  background: string
}

export type PerlerResult = {
  indices: Uint16Array
  palette: PaletteColor[]
  width: number
  height: number
}

const PALETTE = [
  { name: 'Onyx', hex: '#1d0e1f' },
  { name: 'Eggplant', hex: '#2e1632' },
  { name: 'Mulberry', hex: '#5a1e50' },
  { name: 'Magenta', hex: '#b01266' },
  { name: 'Rose', hex: '#ef4a8c' },
  { name: 'Blush', hex: '#f3a2be' },
  { name: 'Lavender', hex: '#b8a8d9' },
  { name: 'Lilac', hex: '#d7c6ea' },
  { name: 'Snow', hex: '#f4eff3' },
  { name: 'Cream', hex: '#f5dfd3' },
  { name: 'Peach', hex: '#f3c7b1' },
  { name: 'Sand', hex: '#d9b7a5' },
  { name: 'Ink', hex: '#151018' },
  { name: 'Violet', hex: '#4b2a73' },
  { name: 'Indigo', hex: '#2c2145' },
  { name: 'Cherry', hex: '#c01945' },
]

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const hexToRgb = (hex: string) => {
  const normalized = hex.replace('#', '')
  const r = Number.parseInt(normalized.slice(0, 2), 16)
  const g = Number.parseInt(normalized.slice(2, 4), 16)
  const b = Number.parseInt(normalized.slice(4, 6), 16)
  return { r, g, b }
}

const srgbToLinear = (channel: number) => {
  const value = channel / 255
  return value <= 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4)
}

const rgbToOklab = (r: number, g: number, b: number) => {
  const rLin = srgbToLinear(r)
  const gLin = srgbToLinear(g)
  const bLin = srgbToLinear(b)

  const l = 0.4122214708 * rLin + 0.5363325363 * gLin + 0.0514459929 * bLin
  const m = 0.2119034982 * rLin + 0.6806995451 * gLin + 0.1073969566 * bLin
  const s = 0.0883024619 * rLin + 0.2817188376 * gLin + 0.6299787005 * bLin

  const lRoot = Math.cbrt(l)
  const mRoot = Math.cbrt(m)
  const sRoot = Math.cbrt(s)

  const L = 0.2104542553 * lRoot + 0.793617785 * mRoot - 0.0040720468 * sRoot
  const A = 1.9779984951 * lRoot - 2.428592205 * mRoot + 0.4505937099 * sRoot
  const B = 0.0259040371 * lRoot + 0.7827717662 * mRoot - 0.808675766 * sRoot

  return { L, A, B }
}

const preparePalette = (palette = PALETTE) =>
  palette.map((item) => {
    const { r, g, b } = hexToRgb(item.hex)
    const lab = rgbToOklab(r, g, b)
    return {
      name: item.name,
      hex: item.hex,
      r,
      g,
      b,
      l: lab.L,
      a: lab.A,
      b2: lab.B,
      count: 0,
    }
  })

const closestColorIndex = (palette: PaletteColor[], r: number, g: number, b: number) => {
  const target = rgbToOklab(r, g, b)
  let bestIndex = 0
  let bestDistance = Infinity
  for (let i = 0; i < palette.length; i += 1) {
    const color = palette[i]
    const dL = target.L - color.l
    const dA = target.A - color.a
    const dB = target.B - color.b2
    const distance = dL * dL + dA * dA + dB * dB
    if (distance < bestDistance) {
      bestDistance = distance
      bestIndex = i
    }
  }
  return bestIndex
}

const ditherImage = (
  data: Float32Array,
  width: number,
  height: number,
  palette: PaletteColor[],
  indices: Uint16Array,
) => {
  const getOffset = (x: number, y: number) => (y * width + x) * 3

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = getOffset(x, y)
      const oldR = data[offset]
      const oldG = data[offset + 1]
      const oldB = data[offset + 2]
      const idx = closestColorIndex(palette, oldR, oldG, oldB)
      const color = palette[idx]
      indices[y * width + x] = idx

      const errR = oldR - color.r
      const errG = oldG - color.g
      const errB = oldB - color.b

      data[offset] = color.r
      data[offset + 1] = color.g
      data[offset + 2] = color.b

      const spread = (nx: number, ny: number, factor: number) => {
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) return
        const target = getOffset(nx, ny)
        data[target] = clamp(data[target] + errR * factor, 0, 255)
        data[target + 1] = clamp(data[target + 1] + errG * factor, 0, 255)
        data[target + 2] = clamp(data[target + 2] + errB * factor, 0, 255)
      }

      spread(x + 1, y, 7 / 16)
      spread(x - 1, y + 1, 3 / 16)
      spread(x, y + 1, 5 / 16)
      spread(x + 1, y + 1, 1 / 16)
    }
  }
}

const quantizeImage = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
  palette: PaletteColor[],
  dither: boolean,
) => {
  const indices = new Uint16Array(width * height)

  if (dither) {
    const floatData = new Float32Array(width * height * 3)
    for (let i = 0; i < width * height; i += 1) {
      const offset = i * 4
      const target = i * 3
      floatData[target] = data[offset]
      floatData[target + 1] = data[offset + 1]
      floatData[target + 2] = data[offset + 2]
    }
    ditherImage(floatData, width, height, palette, indices)
  } else {
    for (let i = 0; i < width * height; i += 1) {
      const offset = i * 4
      const idx = closestColorIndex(palette, data[offset], data[offset + 1], data[offset + 2])
      indices[i] = idx
    }
  }

  return indices
}

const mergeNeighbors = (
  indices: Uint16Array,
  width: number,
  height: number,
  iterations: number,
) => {
  let current = indices
  for (let iter = 0; iter < iterations; iter += 1) {
    const next = new Uint16Array(current.length)
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const counts = new Map<number, number>()
        for (let dy = -1; dy <= 1; dy += 1) {
          const ny = y + dy
          if (ny < 0 || ny >= height) continue
          for (let dx = -1; dx <= 1; dx += 1) {
            const nx = x + dx
            if (nx < 0 || nx >= width) continue
            const idx = current[ny * width + nx]
            counts.set(idx, (counts.get(idx) ?? 0) + 1)
          }
        }
        let chosen = current[y * width + x]
        let bestCount = -1
        counts.forEach((count, key) => {
          if (count > bestCount) {
            bestCount = count
            chosen = key
          }
        })
        next[y * width + x] = chosen
      }
    }
    current = next
  }
  indices.set(current)
}

const computeCounts = (indices: Uint16Array, palette: PaletteColor[]) => {
  palette.forEach((color) => {
    color.count = 0
  })
  for (let i = 0; i < indices.length; i += 1) {
    palette[indices[i]].count += 1
  }
  return palette
}

export const buildPerlerData = (options: PerlerOptions): PerlerResult => {
  const palette = preparePalette(options.palette)
  const canvas = document.createElement('canvas')
  canvas.width = options.gridWidth
  canvas.height = options.gridHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return {
      indices: new Uint16Array(options.gridWidth * options.gridHeight),
      palette,
      width: options.gridWidth,
      height: options.gridHeight,
    }
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.imageSmoothingEnabled = true
  ctx.drawImage(options.image, 0, 0, canvas.width, canvas.height)

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const bg = hexToRgb(options.background)
  for (let i = 0; i < imageData.data.length; i += 4) {
    if (imageData.data[i + 3] < 128) {
      imageData.data[i] = bg.r
      imageData.data[i + 1] = bg.g
      imageData.data[i + 2] = bg.b
      imageData.data[i + 3] = 255
    }
  }

  const indices = quantizeImage(
    imageData.data,
    canvas.width,
    canvas.height,
    palette,
    options.dither,
  )

  if (options.mergeStrength > 0) {
    mergeNeighbors(indices, canvas.width, canvas.height, options.mergeStrength)
  }

  computeCounts(indices, palette)

  return {
    indices,
    palette,
    width: canvas.width,
    height: canvas.height,
  }
}

export const renderBeads = (
  canvas: HTMLCanvasElement,
  data: PerlerResult,
  beadSize: number,
  background = DEFAULT_BACKGROUND,
) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const width = data.width
  const height = data.height
  const size = Math.max(4, Math.round(beadSize))
  canvas.width = width * size
  canvas.height = height * size

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = background
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const radius = size * 0.46
  const holeRadius = size * 0.16
  const outlineWidth = Math.max(1, size * 0.08)

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = data.indices[y * width + x]
      const color = data.palette[index]
      const cx = x * size + size / 2
      const cy = y * size + size / 2

      ctx.beginPath()
      ctx.fillStyle = color.hex
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.fill()

      ctx.lineWidth = outlineWidth
      ctx.strokeStyle = 'rgba(0,0,0,0.22)'
      ctx.stroke()

      ctx.beginPath()
      ctx.fillStyle = 'rgba(255,255,255,0.35)'
      ctx.arc(cx, cy, holeRadius, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

export const renderBoard = (
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  beadSize: number,
  palette: PaletteColor[],
  indices: number[],
  background = DEFAULT_BACKGROUND,
) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const size = Math.max(4, Math.round(beadSize))
  canvas.width = width * size
  canvas.height = height * size

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = background
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const radius = size * 0.46
  const holeRadius = size * 0.16
  const outlineWidth = Math.max(1, size * 0.08)

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = indices[y * width + x] ?? -1
      const cx = x * size + size / 2
      const cy = y * size + size / 2
      const color = index >= 0 ? palette[index]?.hex : '#e8dbe2'

      ctx.beginPath()
      ctx.fillStyle = color || '#e8dbe2'
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.fill()

      ctx.lineWidth = outlineWidth
      ctx.strokeStyle = 'rgba(0,0,0,0.18)'
      ctx.stroke()

      ctx.beginPath()
      ctx.fillStyle = 'rgba(255,255,255,0.55)'
      ctx.arc(cx, cy, holeRadius, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

export const buildPerlerSvg = (
  data: PerlerResult,
  beadSize: number,
  background = DEFAULT_BACKGROUND,
) => {
  const size = Math.max(4, Math.round(beadSize))
  const width = data.width * size
  const height = data.height * size
  const radius = size * 0.46
  const holeRadius = size * 0.16
  const outlineWidth = Math.max(1, size * 0.08)

  const circles: string[] = []
  for (let y = 0; y < data.height; y += 1) {
    for (let x = 0; x < data.width; x += 1) {
      const index = data.indices[y * data.width + x]
      const color = data.palette[index].hex
      const cx = x * size + size / 2
      const cy = y * size + size / 2
      circles.push(
        `<g>` +
          `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="${color}" />` +
          `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="rgba(0,0,0,0.22)" stroke-width="${outlineWidth}" />` +
          `<circle cx="${cx}" cy="${cy}" r="${holeRadius}" fill="rgba(255,255,255,0.35)" />` +
          `</g>`,
      )
    }
  }

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<rect width="100%" height="100%" fill="${background}" />`,
    circles.join(''),
    `</svg>`,
  ].join('')
}

export const DEFAULT_PALETTE = PALETTE
export const DEFAULT_BACKGROUND_COLOR = DEFAULT_BACKGROUND
