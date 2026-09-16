import { useEffect, useRef, useState } from 'react'
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '../types'

export function useCanvasViewport() {
  const workspaceRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(1)
  const [fitScale, setFitScale] = useState(0.25)
  const [showGrid, setShowGrid] = useState(false)

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

  return { workspaceRef, zoom, setZoom, fitScale, showGrid, setShowGrid }
}
