import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState, type ReactNode } from 'react'
import Konva from 'konva'
import {
  Circle,
  Image as KonvaImage,
  Layer,
  Line,
  Rect,
  Stage,
  Transformer,
} from 'react-konva'
import type { BackgroundSettings, LogoPatch, PlaymatProject, ZonePatch } from '../types'
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '../types'
import { useLoadedImage } from '../hooks/useLoadedImage'
import { getBackgroundRect } from '../utils/backgroundGeometry'
import { MemoryGauge } from './canvas/MemoryGauge'
import { ZoneNode } from './canvas/ZoneNode'
import { LogoNode } from './canvas/LogoNode'

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
