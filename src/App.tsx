import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { EditorCanvas, type EditorCanvasHandle } from './components/EditorCanvas'
import { PropertyPanel } from './components/PropertyPanel'
import { createDefaultProject, createId, createZoneFromPreset, normalizeProject, ZONE_PRESETS, type ZonePresetKey } from './defaults'
import type { GaugeSettings, Logo, LogoPatch, PlaymatProject, ZonePatch } from './types'
import { CANVAS_HEIGHT, CANVAS_WIDTH } from './types'

const HISTORY_LIMIT = 40
type ExportResolutionScale = 1 | 2

function safeName(name: string) {
  return name.trim().replace(/[\\/:*?"<>|]/g, '-').slice(0, 80) || 'Mi playmat'
}

function downloadFile(content: BlobPart, fileName: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.click()
  URL.revokeObjectURL(url)
}

function dataUrlToBlob(dataUrl: string) {
  const [header, encoded] = dataUrl.split(',')
  const mime = header.match(/data:(.*?);base64/)?.[1] || 'application/octet-stream'
  const binary = atob(encoded)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
  return new Blob([bytes], { type: mime })
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const image = new window.Image()
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight })
    image.onerror = () => reject(new Error('No se pudieron leer las dimensiones de la imagen.'))
    image.src = dataUrl
  })
}

function openBrowserFile(accept: string): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    input.onchange = () => resolve(input.files?.[0] || null)
    input.click()
  })
}

export default function App() {
  const [project, setProject] = useState<PlaymatProject>(() => createDefaultProject())
  const [past, setPast] = useState<PlaymatProject[]>([])
  const [future, setFuture] = useState<PlaymatProject[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'zone' | 'logo' | 'gauge' | 'canvas'>('zone')
  const [preset, setPreset] = useState<ZonePresetKey>('custom')
  const [zoom, setZoom] = useState(1)
  const [fitScale, setFitScale] = useState(0.25)
  const [showGrid, setShowGrid] = useState(false)
  const [status, setStatus] = useState('Listo')
  const [dirty, setDirty] = useState(false)
  const [exportResolutionScale, setExportResolutionScale] = useState<ExportResolutionScale>(2)
  const [backgroundDimensions, setBackgroundDimensions] = useState<{ width: number; height: number } | null>(null)
  const workspaceRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<EditorCanvasHandle>(null)

  const selectedZone = useMemo(
    () => project.zones.find((zone) => zone.id === selectedId) || null,
    [project.zones, selectedId],
  )
  const selectedLogo = useMemo(
    () => project.logos.find((logo) => logo.id === selectedId) || null,
    [project.logos, selectedId],
  )

  useEffect(() => {
    let active = true
    if (!project.background.dataUrl) {
      setBackgroundDimensions(null)
      return () => { active = false }
    }
    void getImageDimensions(project.background.dataUrl)
      .then((dimensions) => { if (active) setBackgroundDimensions(dimensions) })
      .catch(() => { if (active) setBackgroundDimensions(null) })
    return () => { active = false }
  }, [project.background.dataUrl])

  const commit = useCallback((updater: (current: PlaymatProject) => PlaymatProject) => {
    setProject((current) => {
      const next = updater(current)
      if (next === current) return current
      setPast((items) => [...items.slice(-(HISTORY_LIMIT - 1)), current])
      setFuture([])
      setDirty(true)
      return next
    })
  }, [])

  const undo = useCallback(() => {
    setPast((items) => {
      if (!items.length) return items
      const previous = items[items.length - 1]
      setProject((current) => {
        setFuture((next) => [current, ...next].slice(0, HISTORY_LIMIT))
        return previous
      })
      setDirty(true)
      return items.slice(0, -1)
    })
  }, [])

  const redo = useCallback(() => {
    setFuture((items) => {
      if (!items.length) return items
      const next = items[0]
      setProject((current) => {
        setPast((previous) => [...previous.slice(-(HISTORY_LIMIT - 1)), current])
        return next
      })
      setDirty(true)
      return items.slice(1)
    })
  }, [])

  useEffect(() => {
    const element = workspaceRef.current
    if (!element) return
    const resize = () => {
      const width = Math.max(360, element.clientWidth - 78)
      const height = Math.max(280, element.clientHeight - 102)
      setFitScale(Math.min(width / CANVAS_WIDTH, height / CANVAS_HEIGHT))
    }
    const observer = new ResizeObserver(resize)
    observer.observe(element)
    resize()
    return () => observer.disconnect()
  }, [])

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

  const setBackgroundFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setStatus('El archivo elegido no es una imagen compatible')
      return
    }
    const dataUrl = await readFileAsDataUrl(file)
    commit((current) => ({
      ...current,
      background: { ...current.background, dataUrl, fileName: file.name, offsetX: 0, offsetY: 0, scale: 1 },
    }))
    setActiveTab('canvas')
    setStatus(`Fondo cargado: ${file.name}`)
  }, [commit])

  const chooseBackground = useCallback(async () => {
    try {
      if (window.playmat) {
        const result = await window.playmat.openBackground()
        if (!result) return
        commit((current) => ({
          ...current,
          background: { ...current.background, ...result, offsetX: 0, offsetY: 0, scale: 1 },
        }))
        setActiveTab('canvas')
        setStatus(`Fondo cargado: ${result.name}`)
      } else {
        const file = await openBrowserFile('image/png,image/jpeg,image/webp,image/bmp')
        if (file) await setBackgroundFile(file)
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'No se pudo abrir la imagen')
    }
  }, [commit, setBackgroundFile])

  const chooseLogo = useCallback(async (replace = false) => {
    try {
      let imageData: { name: string; dataUrl: string } | null = null
      if (window.playmat) {
        imageData = await window.playmat.openLogo()
      } else {
        const file = await openBrowserFile('image/png,image/webp,image/jpeg,image/bmp')
        if (file) imageData = { name: file.name, dataUrl: await readFileAsDataUrl(file) }
      }
      if (!imageData) return

      const dimensions = await getImageDimensions(imageData.dataUrl)
      if (replace && selectedLogo) {
        const height = selectedLogo.width * (dimensions.height / dimensions.width)
        changeLogo(selectedLogo.id, { dataUrl: imageData.dataUrl, fileName: imageData.name, height })
        setStatus(`Logo reemplazado: ${imageData.name}`)
        return
      }

      const width = Math.min(680, Math.max(180, dimensions.width))
      const height = width * (dimensions.height / dimensions.width)
      const logo: Logo = {
        id: createId(),
        fileName: imageData.name,
        dataUrl: imageData.dataUrl,
        x: CANVAS_WIDTH / 2 - width / 2,
        y: CANVAS_HEIGHT - height - 100,
        width,
        height,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
      }
      commit((current) => ({ ...current, logos: [...current.logos, logo] }))
      setSelectedId(logo.id)
      setActiveTab('logo')
      setStatus(`Logo agregado: ${imageData.name}`)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'No se pudo abrir el logo')
    }
  }, [changeLogo, commit, selectedLogo])

  const newProject = () => {
    if (dirty && !window.confirm('Hay cambios sin guardar. ¿Querés crear un proyecto nuevo?')) return
    setProject(createDefaultProject())
    setPast([])
    setFuture([])
    setSelectedId(null)
    setDirty(false)
    setStatus('Proyecto nuevo')
  }

  const openProject = useCallback(async () => {
    try {
      let content: string | null = null
      let fileName = ''
      if (window.playmat) {
        const result = await window.playmat.openProject()
        if (!result) return
        content = result.content
        fileName = result.name
      } else {
        const file = await openBrowserFile('.playmat,application/json')
        if (!file) return
        content = await file.text()
        fileName = file.name
      }
      const loaded = normalizeProject(JSON.parse(content))
      setProject(loaded)
      setPast([])
      setFuture([])
      setSelectedId(null)
      setDirty(false)
      setStatus(`Proyecto abierto: ${fileName}`)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'No se pudo abrir el proyecto')
    }
  }, [])

  const saveProject = useCallback(async () => {
    try {
      const content = JSON.stringify(project, null, 2)
      const name = safeName(project.name)
      if (window.playmat) {
        const result = await window.playmat.saveProject({ content, suggestedName: name })
        if (!result) return
        setStatus(`Guardado: ${result.name}`)
      } else {
        downloadFile(content, `${name}.playmat`, 'application/json')
        setStatus('Proyecto descargado')
      }
      setDirty(false)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'No se pudo guardar el proyecto')
    }
  }, [project])

  const exportImage = useCallback(async (format: 'png' | 'jpeg' = 'png') => {
    try {
      setSelectedId(null)
      setStatus('Renderizando imagen en alta resolución…')
      await new Promise((resolve) => requestAnimationFrame(resolve))
      const dataUrl = canvasRef.current?.exportDataUrl(format, exportResolutionScale)
      if (!dataUrl) return
      const name = safeName(project.name)
      if (window.playmat) {
        const result = await window.playmat.exportImage({ dataUrl, format, suggestedName: name })
        if (!result) {
          setStatus('Exportación cancelada')
          return
        }
        setStatus(`Exportado: ${result.name} (${CANVAS_WIDTH * exportResolutionScale} × ${CANVAS_HEIGHT * exportResolutionScale})`)
      } else {
        downloadFile(dataUrlToBlob(dataUrl), `${name}.${format === 'jpeg' ? 'jpg' : 'png'}`, `image/${format}`)
        setStatus(`Imagen exportada (${CANVAS_WIDTH * exportResolutionScale} × ${CANVAS_HEIGHT * exportResolutionScale})`)
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'No se pudo exportar la imagen')
    }
  }, [exportResolutionScale, project.name])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      const editing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault()
        void saveProject()
      } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        if (event.shiftKey) redo()
        else undo()
      } else if (!editing && (event.key === 'Delete' || event.key === 'Backspace')) {
        event.preventDefault()
        if (selectedLogo) deleteLogo()
        else deleteZone()
      } else if (!editing && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'd') {
        event.preventDefault()
        if (selectedLogo) duplicateLogo()
        else duplicateZone()
      } else if (!editing && selectedId && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
        event.preventDefault()
        const distance = event.shiftKey ? 10 : 1
        const item = selectedLogo || selectedZone
        const patch: LogoPatch = {}
        if (event.key === 'ArrowLeft') patch.x = (item?.x || 0) - distance
        if (event.key === 'ArrowRight') patch.x = (item?.x || 0) + distance
        if (event.key === 'ArrowUp') patch.y = (item?.y || 0) - distance
        if (event.key === 'ArrowDown') patch.y = (item?.y || 0) + distance
        if (selectedLogo) changeLogo(selectedId, patch)
        else changeZone(selectedId, patch)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [changeLogo, changeZone, deleteLogo, deleteZone, duplicateLogo, duplicateZone, redo, saveProject, selectedId, selectedLogo, selectedZone, undo])

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark"><span>P</span></div>
          <div><strong>PLAYMAT</strong><small>MAKER</small></div>
        </div>
        <div className="project-title">
          <span>PROYECTO</span>
          <input
            value={project.name}
            onChange={(event) => commit((current) => ({ ...current, name: event.target.value }))}
            aria-label="Nombre del proyecto"
          />
          {dirty && <i title="Cambios sin guardar" />}
        </div>
        <nav className="toolbar">
          <button onClick={newProject} title="Nuevo proyecto">Nuevo</button>
          <button onClick={() => void openProject()} title="Abrir proyecto">Abrir</button>
          <button onClick={() => void saveProject()} title="Guardar (Ctrl+S)">Guardar</button>
          <span className="divider" />
          <button className="icon-button" disabled={!past.length} onClick={undo} title="Deshacer (Ctrl+Z)">↶</button>
          <button className="icon-button" disabled={!future.length} onClick={redo} title="Rehacer (Ctrl+Shift+Z)">↷</button>
          <label className="export-resolution" title="Resolución de la imagen exportada">
            <span>Salida</span>
            <select
              value={exportResolutionScale}
              onChange={(event) => setExportResolutionScale(Number(event.target.value) as ExportResolutionScale)}
            >
              <option value={1}>Estándar · 3675 × 2175 · 150 DPI</option>
              <option value={2}>Imprenta · 7350 × 4350 · 300 DPI</option>
            </select>
          </label>
          <button className="export-button" onClick={() => void exportImage('png')}>Exportar PNG <span>↗</span></button>
        </nav>
      </header>

      <div className="editor-layout">
        <aside className="layers-panel">
          <div className="sidebar-section">
            <div className="section-title"><span>CAPAS</span><em>{project.zones.length + project.logos.length + 2}</em></div>
            <button className={`layer-item special${activeTab === 'canvas' ? ' active' : ''}`} onClick={() => { setActiveTab('canvas'); setSelectedId(null) }}>
              <span className="layer-thumbnail image">▧</span>
              <span><strong>Fondo</strong><small>{project.background.fileName || 'Gradiente'}</small></span>
              <i>●</i>
            </button>
            <button className={`layer-item special${activeTab === 'gauge' ? ' active' : ''}`} onClick={() => { setActiveTab('gauge'); setSelectedId(null) }}>
              <span className="layer-thumbnail gauge">10</span>
              <span><strong>Memory Gauge</strong><small>−10 a 10</small></span>
              <i className={project.gauge.visible ? '' : 'muted'}>●</i>
            </button>
            <div className="zone-list">
              {[...project.logos].reverse().map((logo) => (
                <button
                  key={logo.id}
                  className={`layer-item${selectedId === logo.id ? ' active' : ''}`}
                  onClick={() => { setSelectedId(logo.id); setActiveTab('logo') }}
                >
                  <span className="layer-thumbnail logo"><img src={logo.dataUrl} alt="" /></span>
                  <span><strong>{logo.fileName || 'Logo'}</strong><small>{Math.round(logo.width)} × {Math.round(logo.height)}</small></span>
                  <i
                    className={logo.visible ? '' : 'muted'}
                    title={logo.visible ? 'Ocultar' : 'Mostrar'}
                    onClick={(event) => {
                      event.stopPropagation()
                      changeLogo(logo.id, { visible: !logo.visible })
                    }}
                  >●</i>
                  {logo.locked && <b className="lock">◆</b>}
                </button>
              ))}
              {[...project.zones].reverse().map((zone) => (
                <button
                  key={zone.id}
                  className={`layer-item${selectedId === zone.id ? ' active' : ''}`}
                  onClick={() => { setSelectedId(zone.id); setActiveTab('zone') }}
                >
                  <span className="layer-thumbnail zone">◇</span>
                  <span><strong>{zone.label || 'Sin nombre'}</strong><small>{Math.round(zone.width)} × {Math.round(zone.height)}</small></span>
                  <i
                    className={zone.visible ? '' : 'muted'}
                    title={zone.visible ? 'Ocultar' : 'Mostrar'}
                    onClick={(event) => {
                      event.stopPropagation()
                      changeZone(zone.id, { visible: !zone.visible })
                    }}
                  >●</i>
                  {zone.locked && <b className="lock">◆</b>}
                </button>
              ))}
            </div>
          </div>

          <div className="add-zone-card">
            <span>AÑADIR ZONA</span>
            <select value={preset} onChange={(event) => setPreset(event.target.value as ZonePresetKey)}>
              {Object.entries(ZONE_PRESETS).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}
            </select>
            <button onClick={addZone}><strong>＋</strong> Agregar al lienzo</button>
            <div className="add-divider"><span>O</span></div>
            <button className="add-logo-button" onClick={() => void chooseLogo(false)}><strong>▧</strong> Agregar logo</button>
          </div>

          <div className="sidebar-tip">
            <span>TIP</span>
            <p>Arrastrá una imagen sobre el lienzo para cambiar el fondo.</p>
          </div>
        </aside>

        <main className="workspace" ref={workspaceRef}>
          <div className="workspace-meta">
            <span>LIENZO <strong>{CANVAS_WIDTH} × {CANVAS_HEIGHT} px</strong></span>
            <span className="workspace-status"><i /> {status}</span>
          </div>
          <div className="canvas-scroll">
            <EditorCanvas
              ref={canvasRef}
              project={project}
              selectedId={selectedId}
              scale={fitScale * zoom}
              showGrid={showGrid}
              backgroundEditMode={activeTab === 'canvas'}
              onSelect={(id) => {
                setSelectedId(id)
                if (id) setActiveTab(project.logos.some((logo) => logo.id === id) ? 'logo' : 'zone')
              }}
              onChangeZone={changeZone}
              onChangeLogo={changeLogo}
              onChangeBackground={(patch) => {
                commit((current) => ({ ...current, background: { ...current.background, ...patch } }))
                setStatus('Fondo reposicionado')
              }}
              onDropBackground={(file) => void setBackgroundFile(file)}
            />
          </div>
          <div className="canvas-controls">
            <button className={showGrid ? 'active' : ''} onClick={() => setShowGrid((value) => !value)}># Cuadrícula</button>
            <span />
            <button onClick={() => setZoom(1)}>Ajustar</button>
            <button onClick={() => setZoom((value) => Math.max(0.5, value - 0.1))}>−</button>
            <strong>{Math.round(zoom * 100)}%</strong>
            <button onClick={() => setZoom((value) => Math.min(2.2, value + 0.1))}>＋</button>
          </div>
        </main>

        <PropertyPanel
          project={project}
          selectedZone={selectedZone}
          selectedLogo={selectedLogo}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onZoneChange={(patch) => selectedId && changeZone(selectedId, patch)}
          onLogoChange={(patch) => selectedId && changeLogo(selectedId, patch)}
          onGaugeChange={(patch: Partial<GaugeSettings>) => commit((current) => ({ ...current, gauge: { ...current.gauge, ...patch } }))}
          onBackgroundChange={(patch) => commit((current) => ({ ...current, background: { ...current.background, ...patch } }))}
          onDeleteZone={deleteZone}
          onDuplicateZone={duplicateZone}
          onMoveLayer={moveLayer}
          onDeleteLogo={deleteLogo}
          onDuplicateLogo={duplicateLogo}
          onMoveLogoLayer={moveLogoLayer}
          onChooseBackground={() => void chooseBackground()}
          onChooseLogo={(replace) => void chooseLogo(replace)}
          backgroundDimensions={backgroundDimensions}
          onGeneralColorChange={(color) => commit((current) => ({
            ...current,
            gauge: {
              ...current.gauge,
              leftText: color,
              rightFill: color,
              playerOneFill: color,
              playerTwoText: color,
            },
            zones: current.zones.map((zone) => ({ ...zone, fill: color })),
          }))}
        />
      </div>
    </div>
  )
}
