import type { PlaymatProject } from '../types'
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '../types'

export function getBackgroundRect(image: HTMLImageElement, project: PlaymatProject) {
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

