import { useMemo, type ReactNode } from 'react'
import type Konva from 'konva'
import { Circle, Group, Rect, Line, Text, Image as KonvaImage } from 'react-konva'
import type { Zone, ZonePatch } from '../../types'
import { useLoadedImage } from '../../hooks/useLoadedImage'
import { recolorZoneAsset } from '../../utils/recolorAssets'
import { PSD_ZONE_ASSETS, PSD_LABELS, zoneBreedingEggAsset } from './templateAssets'

interface ZoneNodeProps {
  zone: Zone
  selected: boolean
  registerNode: (id: string, node: Konva.Node | null) => void
  onSelect: () => void
  onDragMove: (node: Konva.Node) => void
  onDragFinish: () => void
  onChange: (patch: ZonePatch) => void
}

export function ZoneNode({ zone, selected, registerNode, onSelect, onDragMove, onDragFinish, onChange }: ZoneNodeProps) {
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

