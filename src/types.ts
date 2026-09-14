export const CANVAS_WIDTH = 3675
export const CANVAS_HEIGHT = 2175

export type BackgroundFit = 'cover' | 'contain' | 'stretch'
export type GaugeDesign = 'standard' | 'players-sides' | 'players-below'
export type ZoneStyle = 'frame' | 'stack' | 'breeding' | 'banner' | 'oval'
export type ZoneTemplate = 'security' | 'breeding' | 'battle' | 'deck' | 'trash' | 'turn-order' | null

export interface BackgroundSettings {
  dataUrl: string | null
  fileName: string
  fit: BackgroundFit
  offsetX: number
  offsetY: number
  scale: number
  opacity: number
  fallbackA: string
  fallbackB: string
}

export interface GaugeSettings {
  design: GaugeDesign
  visible: boolean
  x: number
  y: number
  width: number
  leftFill: string
  rightFill: string
  neutralFill: string
  leftText: string
  rightText: string
  playerOneFill: string
  playerOneText: string
  playerTwoFill: string
  playerTwoText: string
  outline: string
  opacity: number
  fontSize: number
  flipOpponent: boolean
}

export interface Zone {
  id: string
  label: string
  style: ZoneStyle
  template: ZoneTemplate
  x: number
  y: number
  width: number
  height: number
  rotation: number
  fill: string
  fillOpacity: number
  stroke: string
  strokeWidth: number
  textColor: string
  fontSize: number
  radius: number
  visible: boolean
  locked: boolean
}

export interface Logo {
  id: string
  fileName: string
  dataUrl: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  opacity: number
  visible: boolean
  locked: boolean
}

export interface PlaymatProject {
  version: 1
  name: string
  canvas: {
    width: number
    height: number
  }
  background: BackgroundSettings
  gauge: GaugeSettings
  zones: Zone[]
  logos: Logo[]
}

export type ZonePatch = Partial<Omit<Zone, 'id'>>
export type LogoPatch = Partial<Omit<Logo, 'id'>>
