import { useCallback, type Dispatch, type SetStateAction, type RefObject } from 'react'
import { createId, normalizeProject } from '../defaults'
import { CANVAS_HEIGHT, CANVAS_WIDTH, type Logo, type LogoPatch, type PlaymatProject } from '../types'
import type { EditorCanvasHandle } from '../components/EditorCanvas'
import type { EditorTab, ExportResolutionScale } from '../editorTypes'
import { safeName, downloadFile, dataUrlToBlob, readFileAsDataUrl, getImageDimensions, openBrowserFile } from '../utils/files'

interface Options {
  project: PlaymatProject
  commit: (updater: (current: PlaymatProject) => PlaymatProject) => void
  selectedLogo: Logo | null
  changeLogo: (id: string, patch: LogoPatch) => void
  setActiveTab: Dispatch<SetStateAction<EditorTab>>
  setSelectedId: Dispatch<SetStateAction<string | null>>
  setStatus: Dispatch<SetStateAction<string>>
  setProject: Dispatch<SetStateAction<PlaymatProject>>
  setPast: Dispatch<SetStateAction<PlaymatProject[]>>
  setFuture: Dispatch<SetStateAction<PlaymatProject[]>>
  setDirty: Dispatch<SetStateAction<boolean>>
  canvasRef: RefObject<EditorCanvasHandle | null>
  exportResolutionScale: ExportResolutionScale
}

export function useProjectFiles({
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
}: Options) {
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

  return { setBackgroundFile, chooseBackground, chooseLogo, openProject, saveProject, exportImage }
}
