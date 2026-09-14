import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState, type ReactNode } from 'react'
import Konva from 'konva'
import {
  Circle,
  Group,
  Image as KonvaImage,
  Layer,
  Line,
  Rect,
  Stage,
  Text,
  Transformer,
} from 'react-konva'
import type { BackgroundSettings, Logo, LogoPatch, PlaymatProject, Zone, ZonePatch } from '../types'
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '../types'
import memoryGaugeAsset from '../assets/template/memory-gauge.png'
import zoneSecurityAsset from '../assets/template/zone-security.png'
import zoneBreedingAsset from '../assets/template/zone-breeding.png'
import zoneBattleAsset from '../assets/template/zone-battle.png'
import zoneDeckAsset from '../assets/template/zone-deck.png'
import zoneTrashAsset from '../assets/template/zone-trash.png'
import zoneBreedingEggAsset from '../assets/template/zone-breeding-egg.png'
import zoneTurnOrderAsset from '../assets/template/zone-turn-order.png'
import labelSecurityAsset from '../assets/template/label-security.png'
import labelBreedingAsset from '../assets/template/label-breeding.png'
import labelBattleAsset from '../assets/template/label-battle.png'
import labelDeckAsset from '../assets/template/label-deck.png'
import labelTrashAsset from '../assets/template/label-trash.png'
import labelTurnOrderAsset from '../assets/template/label-turn-order.png'
import playerLabelOneAsset from '../assets/template/player-label-1.png'
import playerLabelTwoAsset from '../assets/template/player-label-2.png'
import officialPlayerSideLabelOneAsset from '../assets/template/player-label-side-official-1.svg'
import officialPlayerSideLabelTwoAsset from '../assets/template/player-label-side-official-2.svg'

export interface EditorCanvasHandle {
  exportDataUrl: (format: 'png' | 'jpeg', resolutionScale?: number) => string
}

interface Props {
  project: PlaymatProject
  selectedId: string | null
  scale: number
  showGrid: boolean
  backgroundEditMode: boolean
  onSelect: (id: string | null) => void
  onChangeZone: (id: string, patch: ZonePatch) => void
  onChangeLogo: (id: string, patch: LogoPatch) => void
  onChangeBackground: (patch: Partial<BackgroundSettings>) => void
  onDropBackground: (file: File) => void
}

function useLoadedImage(source: string | null) {
  const [image, setImage] = useState<HTMLImageElement | null>(null)

  useEffect(() => {
    if (!source) {
      setImage(null)
      return
    }
    const next = new window.Image()
    next.onload = () => setImage(next)
    next.src = source
    return () => {
      next.onload = null
    }
  }, [source])

  return image
}

function getBackgroundRect(image: HTMLImageElement, project: PlaymatProject) {
  const settings = project.background
  if (settings.fit === 'stretch') {
    return { x: settings.offsetX, y: settings.offsetY, width: CANVAS_WIDTH, height: CANVAS_HEIGHT }
  }
  const baseScale = settings.fit === 'contain'
    ? Math.min(CANVAS_WIDTH / image.naturalWidth, CANVAS_HEIGHT / image.naturalHeight)
    : Math.max(CANVAS_WIDTH / image.naturalWidth, CANVAS_HEIGHT / image.naturalHeight)
  const width = image.naturalWidth * baseScale * settings.scale
  const height = image.naturalHeight * baseScale * settings.scale
  return {
    x: (CANVAS_WIDTH - width) / 2 + settings.offsetX,
    y: (CANVAS_HEIGHT - height) / 2 + settings.offsetY,
    width,
    height,
  }
}

function hexToRgb(value: string) {
  const normalized = value.replace('#', '')
  const parsed = Number.parseInt(normalized.length === 3
    ? normalized.split('').map((part) => part + part).join('')
    : normalized, 16)
  return { r: (parsed >> 16) & 255, g: (parsed >> 8) & 255, b: parsed & 255 }
}

function recolorZoneAsset(
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

function recolorPlayerLabelAsset(
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

function recolorOfficialPlayerLabelAsset(
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

function MemoryGauge({ project }: { project: PlaymatProject }) {
  const gauge = project.gauge
  const source = useLoadedImage(memoryGaugeAsset)
  const playerOneSource = useLoadedImage(playerLabelOneAsset)
  const playerTwoSource = useLoadedImage(playerLabelTwoAsset)
  const playerSideOneSource = useLoadedImage(officialPlayerSideLabelOneAsset)
  const playerSideTwoSource = useLoadedImage(officialPlayerSideLabelTwoAsset)
  const coloredGauge = useMemo(() => {
    if (!source) return null
    const canvas = document.createElement('canvas')
    canvas.width = source.naturalWidth
    canvas.height = source.naturalHeight
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) return null
    context.drawImage(source, 0, 0)
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height)
    const colors = {
      leftFill: hexToRgb(gauge.leftFill),
      rightFill: hexToRgb(gauge.rightFill),
      leftText: hexToRgb(gauge.leftText),
      rightText: hexToRgb(gauge.rightText),
    }
    const centerX = canvas.width / 2
    for (let index = 0; index < pixels.data.length; index += 4) {
      const alpha = pixels.data[index + 3]
      if (alpha === 0) continue
      const red = pixels.data[index]
      const green = pixels.data[index + 1]
      const blue = pixels.data[index + 2]
      const x = (index / 4) % canvas.width
      const brightest = Math.max(red, green, blue)
      const darkest = Math.min(red, green, blue)
      const isWhite = brightest > 175 && brightest - darkest < 42
      const isBlue = blue > red * 1.18 && blue > green * 1.12 && brightest - darkest > 34
      if (!isWhite && !isBlue) continue

      let target: { r: number; g: number; b: number }
      if (x < centerX) target = isWhite ? colors.leftFill : colors.leftText
      else target = isWhite ? colors.rightText : colors.rightFill
      pixels.data[index] = target.r
      pixels.data[index + 1] = target.g
      pixels.data[index + 2] = target.b
    }
    context.putImageData(pixels, 0, 0)
    return canvas
  }, [gauge.leftFill, gauge.leftText, gauge.rightFill, gauge.rightText, source])
  const playerOneFill = gauge.playerOneFill ?? gauge.rightFill
  const playerOneText = gauge.playerOneText ?? gauge.rightText
  const playerTwoFill = gauge.playerTwoFill ?? gauge.leftFill
  const playerTwoText = gauge.playerTwoText ?? gauge.leftText
  const coloredPlayerOne = useMemo(
    () => playerOneSource ? recolorPlayerLabelAsset(playerOneSource, 1, playerOneFill, playerOneText) : null,
    [playerOneFill, playerOneSource, playerOneText],
  )
  const coloredPlayerTwo = useMemo(
    () => playerTwoSource ? recolorPlayerLabelAsset(playerTwoSource, 2, playerTwoFill, playerTwoText) : null,
    [playerTwoFill, playerTwoSource, playerTwoText],
  )
  const coloredSidePlayerOne = useMemo(
    () => playerSideOneSource ? recolorOfficialPlayerLabelAsset(playerSideOneSource, 1, playerOneFill, playerOneText) : null,
    [playerOneFill, playerOneText, playerSideOneSource],
  )
  const coloredSidePlayerTwo = useMemo(
    () => playerSideTwoSource ? recolorOfficialPlayerLabelAsset(playerSideTwoSource, 2, playerTwoFill, playerTwoText) : null,
    [playerSideTwoSource, playerTwoFill, playerTwoText],
  )

  const isOfficialSideDesign = gauge.design === 'players-sides'
  if (!gauge.visible || !coloredGauge) return null

  const standardGaugeHeight = gauge.width * (154 / 3337)
  const officialWidthRatio = (CANVAS_WIDTH * (1584 / 2384)) / 3337
  const gaugeWidth = isOfficialSideDesign ? gauge.width * officialWidthRatio : gauge.width
  const gaugeHeight = gaugeWidth * (154 / 3337)
  const gaugeX = gauge.x + (gauge.width - gaugeWidth) / 2
  const gaugeY = isOfficialSideDesign
    ? gauge.y - 10 * (gauge.width / 3337)
    : gauge.y + (standardGaugeHeight - gaugeHeight) / 2
  const designScale = gaugeWidth / 3337

  const playerLabels = isOfficialSideDesign ? (() => {
    const gap = gaugeWidth * (44 / 1584)
    const width = gaugeX - gap
    const height = width * (48 / 346)
    const y = gaugeY + (gaugeHeight - height) / 2
    const leftX = 0
    const rightX = CANVAS_WIDTH - width
    return (
      <>
        {coloredSidePlayerOne && <KonvaImage image={coloredSidePlayerOne} x={leftX} y={y} width={width} height={height} />}
        {coloredSidePlayerTwo && <KonvaImage image={coloredSidePlayerTwo} x={rightX} y={y} width={width} height={height} />}
      </>
    )
  })() : gauge.design === 'players-below' ? (() => {
    const width = Math.max(300, 430 * designScale)
    const height = Math.max(68, 92 * designScale)
    const y = gaugeY + gaugeHeight + Math.max(16, 24 * designScale)
    const leftX = 0
    const rightX = CANVAS_WIDTH - width
    return (
      <>
        {coloredPlayerOne && <KonvaImage image={coloredPlayerOne} x={leftX} y={y} width={width} height={height} />}
        {coloredPlayerTwo && <KonvaImage image={coloredPlayerTwo} x={rightX} y={y} width={width} height={height} />}
      </>
    )
  })() : null

  return (
    <Group opacity={gauge.opacity} listening={false}>
      <KonvaImage
        image={coloredGauge}
        x={gaugeX}
        y={gaugeY}
        width={gaugeWidth}
        height={gaugeHeight}
        shadowColor="#000000"
        shadowBlur={22}
        shadowOpacity={0.58}
        shadowOffsetX={0}
        shadowOffsetY={8}
      />
      {playerLabels}
    </Group>
  )
}

const PSD_ZONE_ASSETS = {
  security: zoneSecurityAsset,
  breeding: zoneBreedingAsset,
  battle: zoneBattleAsset,
  deck: zoneDeckAsset,
  trash: zoneTrashAsset,
  'turn-order': zoneTurnOrderAsset,
}

const PSD_LABELS = {
  security: { source: labelSecurityAsset, text: 'Security Stack', x: 186, y: 158, width: 246, height: 127, fontSize: 64, naturalWidth: 583, naturalHeight: 890 },
  breeding: { source: labelBreedingAsset, text: 'Breeding area', x: 319, y: 68, width: 408, height: 63, fontSize: 60, naturalWidth: 1046, naturalHeight: 797 },
  battle: { source: labelBattleAsset, text: 'Battle area', x: 144, y: 64, width: 360, height: 61, fontSize: 60, naturalWidth: 648, naturalHeight: 179 },
  deck: { source: labelDeckAsset, text: 'Deck', x: 159, y: 266, width: 140, height: 53, fontSize: 54, naturalWidth: 451, naturalHeight: 600 },
  trash: { source: labelTrashAsset, text: 'Trash', x: 145, y: 268, width: 162, height: 53, fontSize: 54, naturalWidth: 451, naturalHeight: 601 },
  'turn-order': { source: labelTurnOrderAsset, text: 'Turn Order', x: 143, y: 76, width: 196, height: 279, fontSize: 24, naturalWidth: 465, naturalHeight: 469 },
}

interface ZoneNodeProps {
  zone: Zone
  selected: boolean
  registerNode: (id: string, node: Konva.Node | null) => void
  onSelect: () => void
  onDragMove: (node: Konva.Node) => void
  onDragFinish: () => void
  onChange: (patch: ZonePatch) => void
}

function ZoneNode({ zone, selected, registerNode, onSelect, onDragMove, onDragFinish, onChange }: ZoneNodeProps) {
  const templateImage = useLoadedImage(zone.template ? PSD_ZONE_ASSETS[zone.template] : null)
  const breedingEggImage = useLoadedImage(zone.template === 'breeding' ? zoneBreedingEggAsset : null)
  const coloredTemplateImage = useMemo(
    () => templateImage ? recolorZoneAsset(templateImage, zone.fill, zone.stroke, zone.fillOpacity) : null,
    [templateImage, zone.fill, zone.fillOpacity, zone.stroke],
  )
  const psdLabel = zone.template ? PSD_LABELS[zone.template] : null
  const labelImage = useLoadedImage(psdLabel?.source ?? null)
  if (!zone.visible) return null
  const inset = Math.max(12, zone.strokeWidth * 2.25)
  const labelHeight = Math.min(zone.height, zone.fontSize * 1.7)
  const commonBorder = {
    stroke: zone.stroke,
    strokeWidth: zone.strokeWidth,
    shadowColor: '#000000',
    shadowBlur: selected ? 26 : 13,
    shadowOpacity: selected ? 0.62 : 0.38,
    shadowOffsetY: 5,
  }
  let body: ReactNode
  let labelY = 22

  if (zone.template && coloredTemplateImage) {
    body = (
      <>
        <Rect name="zone-hit-area" width={zone.width} height={zone.height} fill="#000000" opacity={0.01} />
        <KonvaImage image={coloredTemplateImage} width={zone.width} height={zone.height} listening={false} />
        {zone.template === 'breeding' && breedingEggImage && (
          <KonvaImage
            image={breedingEggImage}
            x={zone.width * (131 / 1046)}
            y={zone.height * (293 / 797)}
            width={zone.width * (267 / 1046)}
            height={zone.height * (327 / 797)}
            listening={false}
          />
        )}
      </>
    )
  } else if (zone.style === 'stack') {
    const cardHeight = zone.height * 0.5
    const gap = (zone.height - cardHeight) / 4
    labelY = (cardHeight - labelHeight) / 2
    body = (
      <>{[4, 3, 2, 1, 0].map((card) => (
        <Group key={card} y={card * gap}>
          <Rect width={zone.width} height={cardHeight} fill={zone.fill} opacity={zone.fillOpacity} cornerRadius={zone.radius} />
          <Rect width={zone.width} height={cardHeight} {...commonBorder} cornerRadius={zone.radius} />
          <Rect x={inset} y={inset} width={Math.max(0, zone.width - inset * 2)} height={Math.max(0, cardHeight - inset * 2)} stroke={zone.stroke} strokeWidth={Math.max(2, zone.strokeWidth * 0.4)} opacity={0.72} cornerRadius={Math.max(5, zone.radius * 0.65)} />
        </Group>
      ))}</>
    )
  } else if (zone.style === 'breeding') {
    const slotY = zone.height * 0.37
    const slotGap = 54
    const slotWidth = (zone.width - slotGap * 3) / 2
    const slotHeight = zone.height - slotY - slotGap
    body = (
      <>
        <Rect width={zone.width} height={zone.height} fill={zone.fill} opacity={Math.min(0.82, zone.fillOpacity + 0.12)} cornerRadius={zone.radius + 10} />
        <Rect width={zone.width} height={zone.height} {...commonBorder} strokeWidth={Math.max(3, zone.strokeWidth * 0.75)} opacity={0.62} cornerRadius={zone.radius + 10} />
        <Line points={[38, zone.height * 0.28, zone.width - 38, zone.height * 0.28]} stroke={zone.stroke} strokeWidth={Math.max(2, zone.strokeWidth * 0.45)} opacity={0.48} />
        {[0, 1].map((slot) => (
          <Group key={slot} x={slotGap + slot * (slotWidth + slotGap)} y={slotY}>
            <Rect width={slotWidth} height={slotHeight} fill="#000000" opacity={0.22} cornerRadius={zone.radius} />
            <Rect width={slotWidth} height={slotHeight} stroke={zone.stroke} strokeWidth={zone.strokeWidth} opacity={0.82} cornerRadius={zone.radius} />
            <Rect x={inset} y={inset} width={slotWidth - inset * 2} height={slotHeight - inset * 2} stroke={zone.stroke} strokeWidth={2} opacity={0.35} cornerRadius={Math.max(4, zone.radius * 0.55)} />
          </Group>
        ))}
      </>
    )
  } else if (zone.style === 'banner') {
    const cut = Math.min(28, zone.height * 0.18)
    labelY = (zone.height - labelHeight) / 2
    body = (
      <>
        <Rect width={zone.width} height={zone.height} fill={zone.fill} opacity={zone.fillOpacity} cornerRadius={Math.min(zone.radius, 18)} />
        <Line points={[zone.width * 0.38, cut, zone.width * 0.34, 0, cut, 0, 0, cut, 0, zone.height - cut, cut, zone.height, zone.width * 0.34, zone.height, zone.width * 0.38, zone.height - cut]} {...commonBorder} lineJoin="miter" />
        <Line points={[zone.width * 0.62, cut, zone.width * 0.66, 0, zone.width - cut, 0, zone.width, cut, zone.width, zone.height - cut, zone.width - cut, zone.height, zone.width * 0.66, zone.height, zone.width * 0.62, zone.height - cut]} {...commonBorder} lineJoin="miter" />
        <Line points={[inset, zone.height * 0.2, inset, zone.height * 0.8]} stroke={zone.stroke} strokeWidth={2} opacity={0.5} />
        <Line points={[zone.width - inset, zone.height * 0.2, zone.width - inset, zone.height * 0.8]} stroke={zone.stroke} strokeWidth={2} opacity={0.5} />
      </>
    )
  } else if (zone.style === 'oval') {
    labelY = (zone.height - labelHeight) / 2
    body = (
      <>
        <Circle x={zone.width / 2} y={zone.height / 2} radius={Math.min(zone.width, zone.height) / 2} scaleX={zone.width / Math.min(zone.width, zone.height)} scaleY={zone.height / Math.min(zone.width, zone.height)} fill={zone.fill} opacity={zone.fillOpacity} />
        <Circle x={zone.width / 2} y={zone.height / 2} radius={Math.min(zone.width, zone.height) / 2} scaleX={zone.width / Math.min(zone.width, zone.height)} scaleY={zone.height / Math.min(zone.width, zone.height)} {...commonBorder} />
      </>
    )
  } else {
    body = (
      <>
        <Rect width={zone.width} height={zone.height} fill={zone.fill} opacity={zone.fillOpacity} cornerRadius={zone.radius} />
        <Rect width={zone.width} height={zone.height} {...commonBorder} cornerRadius={zone.radius} />
        <Rect x={inset} y={inset} width={Math.max(0, zone.width - inset * 2)} height={Math.max(0, zone.height - inset * 2)} stroke={zone.stroke} strokeWidth={Math.max(2, zone.strokeWidth * 0.42)} opacity={0.74} cornerRadius={Math.max(5, zone.radius * 0.7)} />
        <Line points={[zone.width * 0.18, 0, zone.width * 0.28, 0]} stroke={zone.stroke} strokeWidth={zone.strokeWidth * 1.55} lineCap="round" />
        <Line points={[zone.width * 0.72, zone.height, zone.width * 0.82, zone.height]} stroke={zone.stroke} strokeWidth={zone.strokeWidth * 1.55} lineCap="round" />
      </>
    )
  }

  return (
    <Group
      ref={(node) => registerNode(zone.id, node)}
      x={zone.x} y={zone.y} rotation={zone.rotation} draggable={!zone.locked}
      onClick={(event) => { event.cancelBubble = true; onSelect() }}
      onTap={(event) => { event.cancelBubble = true; onSelect() }}
      onDragMove={(event) => onDragMove(event.target)}
      onDragEnd={(event) => { onDragFinish(); onChange({ x: event.target.x(), y: event.target.y() }) }}
      onTransformEnd={(event) => {
        const node = event.target
        const scaleX = node.scaleX()
        const scaleY = node.scaleY()
        node.scaleX(1); node.scaleY(1)
        onChange({ x: node.x(), y: node.y(), width: Math.max(120, zone.width * scaleX), height: Math.max(90, zone.height * scaleY), rotation: node.rotation() })
      }}
    >
      {body}
      {psdLabel && labelImage && zone.label === psdLabel.text && zone.textColor.toLowerCase() === '#ffffff' && zone.fontSize === psdLabel.fontSize ? (
        <KonvaImage
          image={labelImage}
          x={zone.width * psdLabel.x / psdLabel.naturalWidth}
          y={zone.height * psdLabel.y / psdLabel.naturalHeight}
          width={zone.width * psdLabel.width / psdLabel.naturalWidth}
          height={zone.height * psdLabel.height / psdLabel.naturalHeight}
          shadowColor="#000000"
          shadowBlur={zone.template === 'turn-order' ? 0 : 11}
          shadowOpacity={zone.template === 'turn-order' ? 0 : 0.9}
          shadowOffsetY={zone.template === 'turn-order' ? 0 : 5}
          listening={false}
        />
      ) : (
        <Text
          x={psdLabel ? zone.width * psdLabel.x / psdLabel.naturalWidth : zone.style === 'banner' ? 22 : 12}
          y={psdLabel ? zone.height * psdLabel.y / psdLabel.naturalHeight : labelY}
          width={psdLabel ? zone.width * psdLabel.width / psdLabel.naturalWidth : zone.width - (zone.style === 'banner' ? 44 : 24)}
          height={psdLabel ? zone.height * psdLabel.height / psdLabel.naturalHeight : labelHeight}
          text={zone.label} fill={zone.textColor} fontFamily='Impact, Haettenschweiler, "Arial Narrow", Arial, sans-serif' fontSize={zone.fontSize}
          align="center" verticalAlign="middle" lineHeight={0.92} stroke="#000000" strokeWidth={1.4} shadowColor="#000000" shadowBlur={11} shadowOpacity={0.9} shadowOffsetY={5} listening={false}
        />
      )}
    </Group>
  )
}

interface LogoNodeProps {
  logo: Logo
  selected: boolean
  registerNode: (id: string, node: Konva.Node | null) => void
  onSelect: () => void
  onDragMove: (node: Konva.Node) => void
  onDragFinish: () => void
  onChange: (patch: LogoPatch) => void
}

function LogoNode({ logo, selected, registerNode, onSelect, onDragMove, onDragFinish, onChange }: LogoNodeProps) {
  const image = useLoadedImage(logo.dataUrl)
  if (!logo.visible || !image) return null
  return (
    <Group
      ref={(node) => registerNode(logo.id, node)} x={logo.x} y={logo.y} rotation={logo.rotation} draggable={!logo.locked}
      onClick={(event) => { event.cancelBubble = true; onSelect() }}
      onTap={(event) => { event.cancelBubble = true; onSelect() }}
      onDragMove={(event) => onDragMove(event.target)}
      onDragEnd={(event) => { onDragFinish(); onChange({ x: event.target.x(), y: event.target.y() }) }}
      onTransformEnd={(event) => {
        const node = event.target
        const factor = Math.max(node.scaleX(), node.scaleY())
        node.scaleX(1); node.scaleY(1)
        onChange({ x: node.x(), y: node.y(), width: Math.max(80, logo.width * factor), height: Math.max(40, logo.height * factor), rotation: node.rotation() })
      }}
    >
      <KonvaImage image={image} width={logo.width} height={logo.height} opacity={logo.opacity} shadowColor="#000000" shadowBlur={selected ? 22 : 12} shadowOpacity={0.48} shadowOffsetY={5} />
    </Group>
  )
}

interface AlignmentGuide {
  axis: 'x' | 'y'
  position: number
}

const SNAP_DISTANCE = 10

export const EditorCanvas = forwardRef<EditorCanvasHandle, Props>(function EditorCanvas(
  { project, selectedId, scale, showGrid, backgroundEditMode, onSelect, onChangeZone, onChangeLogo, onChangeBackground, onDropBackground }, ref,
) {
  const stageRef = useRef<Konva.Stage>(null)
  const transformerRef = useRef<Konva.Transformer>(null)
  const selectionLayerRef = useRef<Konva.Layer>(null)
  const gridLayerRef = useRef<Konva.Layer>(null)
  const editableNodes = useRef(new Map<string, Konva.Node>())
  const [dragActive, setDragActive] = useState(false)
  const [alignmentGuides, setAlignmentGuides] = useState<AlignmentGuide[]>([])
  const backgroundImage = useLoadedImage(project.background.dataUrl)
  const backgroundRect = useMemo(() => backgroundImage ? getBackgroundRect(backgroundImage, project) : null, [backgroundImage, project])
  const selectedZone = project.zones.find((item) => item.id === selectedId)
  const selectedLogo = project.logos.find((item) => item.id === selectedId)

  const updateAlignmentGuides = (node: Konva.Node) => {
    const layer = node.getLayer()
    if (!layer) return

    const verticalStops = [0, CANVAS_WIDTH / 2, CANVAS_WIDTH]
    const horizontalStops = [0, CANVAS_HEIGHT / 2, CANVAS_HEIGHT]
    editableNodes.current.forEach((otherNode) => {
      if (otherNode === node || !otherNode.isVisible()) return
      const box = otherNode.getClientRect({ relativeTo: layer, skipShadow: true })
      verticalStops.push(box.x, box.x + box.width / 2, box.x + box.width)
      horizontalStops.push(box.y, box.y + box.height / 2, box.y + box.height)
    })

    const box = node.getClientRect({ relativeTo: layer, skipShadow: true })
    const movingVertical = [box.x, box.x + box.width / 2, box.x + box.width]
    const movingHorizontal = [box.y, box.y + box.height / 2, box.y + box.height]
    const snapDistance = SNAP_DISTANCE / Math.max(scale, 0.01)
    let verticalSnap: { distance: number; delta: number; position: number } | null = null
    let horizontalSnap: { distance: number; delta: number; position: number } | null = null

    for (const stop of verticalStops) {
      for (const edge of movingVertical) {
        const delta = stop - edge
        const distance = Math.abs(delta)
        if (distance <= snapDistance && (!verticalSnap || distance < verticalSnap.distance)) {
          verticalSnap = { distance, delta, position: stop }
        }
      }
    }
    for (const stop of horizontalStops) {
      for (const edge of movingHorizontal) {
        const delta = stop - edge
        const distance = Math.abs(delta)
        if (distance <= snapDistance && (!horizontalSnap || distance < horizontalSnap.distance)) {
          horizontalSnap = { distance, delta, position: stop }
        }
      }
    }

    const guides: AlignmentGuide[] = []
    if (verticalSnap) {
      node.x(node.x() + verticalSnap.delta)
      guides.push({ axis: 'x', position: verticalSnap.position })
    }
    if (horizontalSnap) {
      node.y(node.y() + horizontalSnap.delta)
      guides.push({ axis: 'y', position: horizontalSnap.position })
    }
    setAlignmentGuides(guides)
  }

  useEffect(() => {
    const transformer = transformerRef.current
    if (!transformer) return
    const node = selectedId ? editableNodes.current.get(selectedId) : null
    const item = selectedZone || selectedLogo
    transformer.nodes(node && item && !item.locked && item.visible && !backgroundEditMode ? [node] : [])
    transformer.getLayer()?.batchDraw()
  }, [backgroundEditMode, selectedId, selectedLogo, selectedZone])

  useImperativeHandle(ref, () => ({
    exportDataUrl(format, resolutionScale = 1) {
      const stage = stageRef.current
      if (!stage) throw new Error('El lienzo todavía no está listo.')
      const hitAreas = stage.find('.zone-hit-area')
      hitAreas.forEach((node) => node.hide())
      selectionLayerRef.current?.hide(); gridLayerRef.current?.hide(); stage.draw()
      const dataUrl = stage.toDataURL({
        mimeType: format === 'jpeg' ? 'image/jpeg' : 'image/png',
        quality: 0.94,
        pixelRatio: resolutionScale / scale,
      })
      hitAreas.forEach((node) => node.show())
      selectionLayerRef.current?.show(); if (showGrid) gridLayerRef.current?.show(); stage.draw()
      return dataUrl
    },
  }), [scale, showGrid])

  const gridLines = useMemo(() => {
    const lines: ReactNode[] = []
    for (let x = 0; x <= CANVAS_WIDTH; x += 175) lines.push(<Line key={`x-${x}`} points={[x, 0, x, CANVAS_HEIGHT]} stroke="#ffffff" strokeWidth={1} opacity={0.14} />)
    for (let y = 0; y <= CANVAS_HEIGHT; y += 175) lines.push(<Line key={`y-${y}`} points={[0, y, CANVAS_WIDTH, y]} stroke="#ffffff" strokeWidth={1} opacity={0.14} />)
    return lines
  }, [])

  return (
    <div
      className={`canvas-frame${dragActive ? ' is-dragging-file' : ''}${backgroundEditMode && backgroundImage ? ' is-background-mode' : ''}`}
      style={{ width: CANVAS_WIDTH * scale, height: CANVAS_HEIGHT * scale }}
      onDragEnter={(event) => { event.preventDefault(); setDragActive(true) }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={(event) => { if (event.currentTarget === event.target) setDragActive(false) }}
      onDrop={(event) => { event.preventDefault(); setDragActive(false); const file = event.dataTransfer.files[0]; if (file?.type.startsWith('image/')) onDropBackground(file) }}
    >
      <Stage
        ref={stageRef} width={CANVAS_WIDTH * scale} height={CANVAS_HEIGHT * scale} scaleX={scale} scaleY={scale}
        onMouseDown={(event) => { setAlignmentGuides([]); if (event.target === event.target.getStage()) onSelect(null) }}
        onTouchStart={(event) => { setAlignmentGuides([]); if (event.target === event.target.getStage()) onSelect(null) }}
      >
        <Layer>
          <Rect width={CANVAS_WIDTH} height={CANVAS_HEIGHT} fillLinearGradientStartPoint={{ x: 0, y: 0 }} fillLinearGradientEndPoint={{ x: CANVAS_WIDTH, y: CANVAS_HEIGHT }} fillLinearGradientColorStops={[0, project.background.fallbackA, 1, project.background.fallbackB]} listening={false} />
          <Circle x={690} y={1630} radius={720} fill="#1fb5ad" opacity={0.08} listening={false} />
          <Circle x={2920} y={750} radius={860} fill="#2978ff" opacity={0.1} listening={false} />
          {backgroundImage && backgroundRect && (
            <KonvaImage
              image={backgroundImage} {...backgroundRect} opacity={project.background.opacity} draggable={backgroundEditMode} listening={backgroundEditMode}
              onDragStart={() => onSelect(null)}
              onDragEnd={(event) => onChangeBackground({ offsetX: project.background.offsetX + event.target.x() - backgroundRect.x, offsetY: project.background.offsetY + event.target.y() - backgroundRect.y })}
            />
          )}
          <Rect width={CANVAS_WIDTH} height={CANVAS_HEIGHT} stroke="#ffffff" strokeWidth={12} opacity={0.3} listening={false} />
        </Layer>
        <Layer listening={!backgroundEditMode}>
          <MemoryGauge project={project} />
          {project.zones.map((zone) => (
            <ZoneNode key={zone.id} zone={zone} selected={selectedId === zone.id}
              registerNode={(id, node) => { if (node) editableNodes.current.set(id, node); else editableNodes.current.delete(id) }}
              onSelect={() => onSelect(zone.id)} onDragMove={updateAlignmentGuides} onDragFinish={() => setAlignmentGuides([])}
              onChange={(patch) => onChangeZone(zone.id, patch)} />
          ))}
          {project.logos.map((logo) => (
            <LogoNode key={logo.id} logo={logo} selected={selectedId === logo.id}
              registerNode={(id, node) => { if (node) editableNodes.current.set(id, node); else editableNodes.current.delete(id) }}
              onSelect={() => onSelect(logo.id)} onDragMove={updateAlignmentGuides} onDragFinish={() => setAlignmentGuides([])}
              onChange={(patch) => onChangeLogo(logo.id, patch)} />
          ))}
        </Layer>
        <Layer ref={gridLayerRef} visible={showGrid} listening={false}>
          {gridLines}
          <Line points={[CANVAS_WIDTH / 2, 0, CANVAS_WIDTH / 2, CANVAS_HEIGHT]} stroke="#5ce1e6" strokeWidth={3} opacity={0.45} />
          <Line points={[0, CANVAS_HEIGHT / 2, CANVAS_WIDTH, CANVAS_HEIGHT / 2]} stroke="#5ce1e6" strokeWidth={3} opacity={0.45} />
        </Layer>
        <Layer ref={selectionLayerRef}>
          {alignmentGuides.map((guide) => guide.axis === 'x' ? (
            <Line key={`guide-x-${guide.position}`} points={[guide.position, 0, guide.position, CANVAS_HEIGHT]}
              stroke="#ff4fd8" strokeWidth={2 / scale} dash={[10 / scale, 6 / scale]} opacity={0.95} listening={false} />
          ) : (
            <Line key={`guide-y-${guide.position}`} points={[0, guide.position, CANVAS_WIDTH, guide.position]}
              stroke="#ff4fd8" strokeWidth={2 / scale} dash={[10 / scale, 6 / scale]} opacity={0.95} listening={false} />
          ))}
          <Transformer ref={transformerRef} rotateEnabled keepRatio={Boolean(selectedLogo)} enabledAnchors={selectedLogo ? ['top-left', 'top-right', 'bottom-left', 'bottom-right'] : undefined} flipEnabled={false}
            borderStroke="#5ce1e6" borderStrokeWidth={3} anchorFill="#0e1b2d" anchorStroke="#5ce1e6" anchorStrokeWidth={3} anchorSize={20} rotateAnchorOffset={38}
            boundBoxFunc={(oldBox, newBox) => newBox.width < 80 || newBox.height < 40 ? oldBox : newBox} />
        </Layer>
      </Stage>
      {dragActive && <div className="drop-hint">Soltá la imagen para usarla como fondo</div>}
      {backgroundEditMode && backgroundImage && <div className="background-move-hint">Arrastrá para centrar el fondo</div>}
    </div>
  )
})
