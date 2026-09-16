import { useCallback, useMemo, useRef, useState } from 'react'
import type { EditorCanvasHandle } from '../components/EditorCanvas'
import { applyPlaymatPreset, PLAYMAT_PRESETS, type PlaymatPresetKey, createDefaultProject, createId, createZoneFromPreset, ZONE_PRESETS, type ZonePresetKey } from '../defaults'
import type { BackgroundSettings, GaugeSettings, Logo, LogoPatch, ZonePatch } from '../types'
import { useCanvasViewport } from './useCanvasViewport'
import type { EditorTab, ExportResolutionScale } from '../editorTypes'
import { useImageDimensions } from './useImageDimensions'
import { useProjectHistory } from './useProjectHistory'
import { useProjectFiles } from './useProjectFiles'

export function usePlaymatEditor() {
  const { project, setProject, past, setPast, future, setFuture, dirty, setDirty, commit, undo, redo } = useProjectHistory()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<EditorTab>('zone')
  const [preset, setPreset] = useState<ZonePresetKey>('custom')
  const [status, setStatus] = useState('Listo')
  const [exportResolutionScale, setExportResolutionScale] = useState<ExportResolutionScale>(2)
  const backgroundDimensions = useImageDimensions(project.background.dataUrl)
  const { workspaceRef, zoom, setZoom, fitScale, showGrid, setShowGrid } = useCanvasViewport()
  const canvasRef = useRef<EditorCanvasHandle>(null)

  const selectedZone = useMemo(
    () => project.zones.find((zone) => zone.id === selectedId) || null,
    [project.zones, selectedId],
  )
  const selectedLogo = useMemo(
    () => project.logos.find((logo) => logo.id === selectedId) || null,
    [project.logos, selectedId],
  )

  const changeZone = useCallback((id: string, patch: ZonePatch) => {
    commit((current) => ({
      ...current,
      zones: current.zones.map((zone) => zone.id === id ? { ...zone, ...patch } : zone),
    }))
  }, [commit])

  const changeLogo = useCallback((id: string, patch: LogoPatch) => {
    commit((current) => ({
      ...current,
      logos: current.logos.map((logo) => logo.id === id ? { ...logo, ...patch } : logo),
    }))
  }, [commit])

  const applyPreset = (key: PlaymatPresetKey) => {
    commit((current) => applyPlaymatPreset(current, key))
    setSelectedId(null)
    setActiveTab(key === 'empty' ? 'canvas' : 'gauge')
    setStatus('Preset aplicado: ' + PLAYMAT_PRESETS[key])
  }

  const addZone = () => {
    const next = createZoneFromPreset(preset, project.zones.length)
    commit((current) => ({ ...current, zones: [...current.zones, next] }))
    setSelectedId(next.id)
    setActiveTab('zone')
    setStatus(`${ZONE_PRESETS[preset].label} agregada`)
  }

  const deleteZone = useCallback(() => {
    if (!selectedId) return
    commit((current) => ({ ...current, zones: current.zones.filter((zone) => zone.id !== selectedId) }))
    setSelectedId(null)
    setStatus('Zona eliminada')
  }, [commit, selectedId])

  const duplicateZone = useCallback(() => {
    if (!selectedZone) return
    const copy = { ...selectedZone, id: createId(), label: `${selectedZone.label} copia`, x: selectedZone.x + 55, y: selectedZone.y + 55 }
    commit((current) => ({ ...current, zones: [...current.zones, copy] }))
    setSelectedId(copy.id)
    setStatus('Zona duplicada')
  }, [commit, selectedZone])

  const moveLayer = (direction: -1 | 1) => {
    if (!selectedId) return
    commit((current) => {
      const index = current.zones.findIndex((zone) => zone.id === selectedId)
      const nextIndex = Math.max(0, Math.min(current.zones.length - 1, index + direction))
      if (index < 0 || index === nextIndex) return current
      const zones = [...current.zones]
      const [item] = zones.splice(index, 1)
      zones.splice(nextIndex, 0, item)
      return { ...current, zones }
    })
  }

  const deleteLogo = useCallback(() => {
    if (!selectedLogo) return
    commit((current) => ({ ...current, logos: current.logos.filter((logo) => logo.id !== selectedLogo.id) }))
    setSelectedId(null)
    setStatus('Logo eliminado')
  }, [commit, selectedLogo])

  const duplicateLogo = useCallback(() => {
    if (!selectedLogo) return
    const copy: Logo = { ...selectedLogo, id: createId(), fileName: `${selectedLogo.fileName} copia`, x: selectedLogo.x + 55, y: selectedLogo.y + 55 }
    commit((current) => ({ ...current, logos: [...current.logos, copy] }))
    setSelectedId(copy.id)
    setActiveTab('logo')
    setStatus('Logo duplicado')
  }, [commit, selectedLogo])

  const moveLogoLayer = (direction: -1 | 1) => {
    if (!selectedLogo) return
    commit((current) => {
      const index = current.logos.findIndex((logo) => logo.id === selectedLogo.id)
      const nextIndex = Math.max(0, Math.min(current.logos.length - 1, index + direction))
      if (index < 0 || index === nextIndex) return current
      const logos = [...current.logos]
      const [item] = logos.splice(index, 1)
      logos.splice(nextIndex, 0, item)
      return { ...current, logos }
    })
  }

  const changeGauge = (patch: Partial<GaugeSettings>) => {
    commit((current) => ({ ...current, gauge: { ...current.gauge, ...patch } }))
  }

  const changeBackground = (patch: Partial<BackgroundSettings>) => {
    commit((current) => ({ ...current, background: { ...current.background, ...patch } }))
  }

  const repositionBackground = (patch: Partial<BackgroundSettings>) => {
    changeBackground(patch)
    setStatus('Fondo reposicionado')
  }

  const changeGeneralColor = (color: string) => {
    commit((current) => ({
      ...current,
      gauge: {
        ...current.gauge,
        leftText: color,
        rightFill: color,
        playerOneFill: color,
        playerTwoText: color,
      },
      zones: current.zones.map((zone) => ({ ...zone, fill: color })),
    }))
  }

  const selectCanvasItem = (id: string | null) => {
    setSelectedId(id)
    if (id) setActiveTab(project.logos.some((logo) => logo.id === id) ? 'logo' : 'zone')
  }

  const newProject = () => {
    if (dirty && !window.confirm('Hay cambios sin guardar. ¿Querés crear un proyecto nuevo?')) return
    setProject(createDefaultProject())
    setPast([])
    setFuture([])
    setSelectedId(null)
    setDirty(false)
    setStatus('Proyecto nuevo')
  }

  const files = useProjectFiles({
    project,
    commit,
    selectedLogo,
    changeLogo,
    setActiveTab,
    setSelectedId,
    setStatus,
    setProject,
    setPast,
    setFuture,
    setDirty,
    canvasRef,
    exportResolutionScale,
  })

  return {
    project,
    past,
    future,
    selectedId,
    setSelectedId,
    activeTab,
    setActiveTab,
    preset,
    setPreset,
    zoom,
    setZoom,
    fitScale,
    showGrid,
    setShowGrid,
    status,
    setStatus,
    dirty,
    exportResolutionScale,
    setExportResolutionScale,
    backgroundDimensions,
    workspaceRef,
    canvasRef,
    selectedZone,
    selectedLogo,
    commit,
    undo,
    redo,
    changeZone,
    changeLogo,
    addZone,
    applyPreset,
    deleteZone,
    duplicateZone,
    moveLayer,
    deleteLogo,
    duplicateLogo,
    moveLogoLayer,
    newProject,
    changeGauge,
    changeBackground,
    repositionBackground,
    changeGeneralColor,
    selectCanvasItem,
    ...files,
  }
}

export type PlaymatEditor = ReturnType<typeof usePlaymatEditor>
