import type { PlaymatProject, Zone, ZoneStyle, ZoneTemplate } from './types'
import { CANVAS_HEIGHT, CANVAS_WIDTH } from './types'

export const createId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `zone-${Date.now()}-${Math.random().toString(16).slice(2)}`

const zone = (
  label: string,
  style: ZoneStyle,
  x: number,
  y: number,
  width: number,
  height: number,
  overrides: Partial<Zone> = {},
): Zone => ({
  id: createId(),
  label,
  style,
  template: null,
  x,
  y,
  width,
  height,
  rotation: 0,
  fill: '#071526',
  fillOpacity: 0.2,
  stroke: '#d8efff',
  strokeWidth: 7,
  textColor: '#ffffff',
  fontSize: 62,
  radius: 26,
  visible: true,
  locked: false,
  ...overrides,
})

const psdAppearance = (template: Exclude<ZoneTemplate, null>): Partial<Zone> => ({
  template,
  stroke: '#ffffff',
  fill: template === 'deck' || template === 'trash' ? '#b1c3cc' : '#a1b8c3',
  fillOpacity: 1,
})

export function createDefaultProject(): PlaymatProject {
  return {
    version: 1,
    name: 'Mi playmat',
    canvas: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
    background: {
      dataUrl: null,
      fileName: '',
      fit: 'cover',
      offsetX: 0,
      offsetY: 0,
      scale: 1,
      opacity: 1,
      fallbackA: '#091425',
      fallbackB: '#153b55',
    },
    gauge: {
      design: 'standard',
      visible: true,
      x: 169,
      y: 76,
      width: 3337,
      leftFill: '#ffffff',
      rightFill: '#225fac',
      neutralFill: '#225fac',
      leftText: '#225fac',
      rightText: '#ffffff',
      playerOneFill: '#225fac',
      playerOneText: '#ffffff',
      playerTwoFill: '#ffffff',
      playerTwoText: '#225fac',
      outline: '#ffffff',
      opacity: 1,
      fontSize: 76,
      flipOpponent: true,
    },
    zones: [
      zone('Security Stack', 'stack', 0, 348, 583, 890, { ...psdAppearance('security'), fontSize: 64 }),
      zone('Breeding area', 'breeding', 96, 1288, 1009, 781, { ...psdAppearance('breeding'), fontSize: 60 }),
      zone('Battle area', 'banner', 1514, 543, 648, 179, { ...psdAppearance('battle'), fontSize: 60 }),
      zone('Deck', 'frame', 3156, 348, 435, 595, { ...psdAppearance('deck'), fontSize: 54 }),
      zone('Trash', 'frame', 3156, 992, 435, 596, { ...psdAppearance('trash'), fontSize: 54 }),
      zone('Turn Order', 'frame', 3140, 1640, 465, 469, { ...psdAppearance('turn-order'), fontSize: 24 }),
    ],
    logos: [],
  }
}

export const PLAYMAT_PRESETS = {
  all: 'Todos los elementos',
  withoutTurnOrder: 'Sin Turn Order',
  gaugeOnly: 'Solo Memory Gauge',
  empty: 'Vacío',
} as const

export type PlaymatPresetKey = keyof typeof PLAYMAT_PRESETS

export function applyPlaymatPreset(project: PlaymatProject, key: PlaymatPresetKey): PlaymatProject {
  const defaults = createDefaultProject()
  return {
    ...project,
    zones: key === 'empty' || key === 'gaugeOnly'
      ? []
      : defaults.zones.filter((zone) => key !== 'withoutTurnOrder' || zone.template !== 'turn-order'),
    gauge: { ...defaults.gauge, visible: key !== 'empty' },
    logos: [],
  }
}

export type ZonePresetKey = 'deck' | 'trash' | 'security' | 'breeding' | 'battle' | 'turnOrder' | 'custom'

export const ZONE_PRESETS: Record<ZonePresetKey, { label: string; style: ZoneStyle; template: ZoneTemplate; width: number; height: number; fontSize?: number }> = {
  deck: { label: 'Deck', style: 'frame', template: 'deck', width: 435, height: 595 },
  trash: { label: 'Trash', style: 'frame', template: 'trash', width: 435, height: 596 },
  security: { label: 'Security Stack', style: 'stack', template: 'security', width: 583, height: 890 },
  breeding: { label: 'Breeding area', style: 'breeding', template: 'breeding', width: 1009, height: 781 },
  battle: { label: 'Battle area', style: 'banner', template: 'battle', width: 648, height: 179 },
  turnOrder: { label: 'Turn Order', style: 'frame', template: 'turn-order', width: 465, height: 469, fontSize: 24 },
  custom: { label: 'Nueva zona', style: 'frame', template: null, width: 560, height: 360 },
}

export function createZoneFromPreset(key: ZonePresetKey, index: number): Zone {
  const preset = ZONE_PRESETS[key]
  const stagger = (index % 6) * 34
  return zone(
    preset.label,
    preset.style,
    CANVAS_WIDTH / 2 - preset.width / 2 + stagger,
    CANVAS_HEIGHT / 2 - preset.height / 2 + stagger,
    preset.width,
    preset.height,
    {
      ...(preset.template ? psdAppearance(preset.template) : {}),
      ...(preset.fontSize ? { fontSize: preset.fontSize } : {}),
    },
  )
}

export function normalizeProject(input: unknown): PlaymatProject {
  const fallback = createDefaultProject()
  if (!input || typeof input !== 'object') throw new Error('El archivo no contiene un proyecto válido.')
  const candidate = input as Partial<PlaymatProject>
  if (!Array.isArray(candidate.zones)) throw new Error('El proyecto no contiene una lista de zonas válida.')

  return {
    ...fallback,
    ...candidate,
    version: 1,
    canvas: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
    background: { ...fallback.background, ...candidate.background },
    gauge: { ...fallback.gauge, ...candidate.gauge },
    zones: candidate.zones.map((item, index) => ({
      ...zone(`Zona ${index + 1}`, 'frame', 100, 100, 500, 350),
      ...item,
      id: item.id || createId(),
    })),
    logos: Array.isArray(candidate.logos) ? candidate.logos : [],
  }
}
