export function hexToRgb(value: string) {
  const normalized = value.replace('#', '')
  const parsed = Number.parseInt(normalized.length === 3
    ? normalized.split('').map((part) => part + part).join('')
    : normalized, 16)
  return { r: (parsed >> 16) & 255, g: (parsed >> 8) & 255, b: parsed & 255 }
}

export function recolorZoneAsset(
  source: HTMLImageElement,
  fillColor: string,
  strokeColor: string,
  fillOpacity: number,
) {
  const canvas = document.createElement('canvas')
  canvas.width = source.naturalWidth
  canvas.height = source.naturalHeight
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) return null
  context.drawImage(source, 0, 0)
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height)
  const fill = hexToRgb(fillColor)
  const stroke = hexToRgb(strokeColor)

  for (let index = 0; index < pixels.data.length; index += 4) {
    const sourceAlpha = pixels.data[index + 3]
    if (sourceAlpha === 0) continue
    const brightness = pixels.data[index] * 0.299 + pixels.data[index + 1] * 0.587 + pixels.data[index + 2] * 0.114
    const strokeWeight = Math.max(0, Math.min(1, (brightness - 215) / 35))
    const fillWeight = 1 - strokeWeight
    pixels.data[index] = Math.round(fill.r * fillWeight + stroke.r * strokeWeight)
    pixels.data[index + 1] = Math.round(fill.g * fillWeight + stroke.g * strokeWeight)
    pixels.data[index + 2] = Math.round(fill.b * fillWeight + stroke.b * strokeWeight)
    pixels.data[index + 3] = Math.round(sourceAlpha * (fillOpacity * fillWeight + strokeWeight))
  }
  context.putImageData(pixels, 0, 0)
  return canvas
}

export function recolorPlayerLabelAsset(
  source: HTMLImageElement,
  player: 1 | 2,
  fillColor: string,
  textColor: string,
) {
  const crop = player === 1
    ? { x: 0, y: 220 / 808, right: 1756 / 1945, bottom: 597 / 808 }
    : { x: 468 / 1935, y: 207 / 813, right: 1840 / 1935, bottom: 595 / 813 }
  const sourceX = Math.round(source.naturalWidth * crop.x)
  const sourceY = Math.round(source.naturalHeight * crop.y)
  const sourceWidth = Math.round(source.naturalWidth * (crop.right - crop.x))
  const sourceHeight = Math.round(source.naturalHeight * (crop.bottom - crop.y))
  const canvas = document.createElement('canvas')
  canvas.width = sourceWidth
  canvas.height = sourceHeight
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) return null
  context.drawImage(source, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, sourceWidth, sourceHeight)
  const pixels = context.getImageData(0, 0, sourceWidth, sourceHeight)
  const fill = hexToRgb(fillColor)
  const text = hexToRgb(textColor)
  // PLAYER2's source plate has a shorter leading diagonal; using PLAYER1's
  // proportion clips the top-left of the P and removes its original padding.
  const diagonal = sourceWidth * (player === 1 ? 0.22 : 0.15)

  for (let index = 0; index < pixels.data.length; index += 4) {
    const pixel = index / 4
    const x = pixel % sourceWidth
    const y = Math.floor(pixel / sourceWidth)
    const progress = sourceHeight > 1 ? y / (sourceHeight - 1) : 0
    const inside = player === 1
      ? x <= sourceWidth - diagonal + diagonal * progress
      : x >= diagonal - diagonal * progress
    if (!inside) {
      pixels.data[index + 3] = 0
      continue
    }

    const brightness = pixels.data[index] * 0.299 + pixels.data[index + 1] * 0.587 + pixels.data[index + 2] * 0.114
    const lightWeight = Math.max(0, Math.min(1, (brightness - 120) / 105))
    const textWeight = player === 1 ? lightWeight : 1 - lightWeight
    const fillWeight = 1 - textWeight
    pixels.data[index] = Math.round(fill.r * fillWeight + text.r * textWeight)
    pixels.data[index + 1] = Math.round(fill.g * fillWeight + text.g * textWeight)
    pixels.data[index + 2] = Math.round(fill.b * fillWeight + text.b * textWeight)
    pixels.data[index + 3] = 255
  }
  context.putImageData(pixels, 0, 0)
  return canvas
}

export function recolorOfficialPlayerLabelAsset(
  source: HTMLImageElement,
  player: 1 | 2,
  fillColor: string,
  textColor: string,
) {
  const canvas = document.createElement('canvas')
  canvas.width = source.naturalWidth
  canvas.height = source.naturalHeight
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) return null
  context.drawImage(source, 0, 0)
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height)
  const fill = hexToRgb(fillColor)
  const text = hexToRgb(textColor)

  for (let index = 0; index < pixels.data.length; index += 4) {
    const alpha = pixels.data[index + 3]
    if (alpha === 0) continue
    const brightness = pixels.data[index] * 0.299 + pixels.data[index + 1] * 0.587 + pixels.data[index + 2] * 0.114
    const lightWeight = brightness / 255
    const textWeight = player === 1 ? 1 - lightWeight : lightWeight
    const fillWeight = 1 - textWeight
    pixels.data[index] = Math.round(fill.r * fillWeight + text.r * textWeight)
    pixels.data[index + 1] = Math.round(fill.g * fillWeight + text.g * textWeight)
    pixels.data[index + 2] = Math.round(fill.b * fillWeight + text.b * textWeight)
    pixels.data[index + 3] = alpha
  }
  context.putImageData(pixels, 0, 0)
  return canvas
}

