import type { EditorTab } from '../../editorTypes'
import type { GaugeSettings, Logo, LogoPatch, PlaymatProject, Zone, ZonePatch } from '../../types'

export interface PropertyPanelProps {
  project: PlaymatProject
  selectedZone: Zone | null
  selectedLogo: Logo | null
  activeTab: EditorTab
  onTabChange: (tab: EditorTab) => void
  onZoneChange: (patch: ZonePatch) => void
  onLogoChange: (patch: LogoPatch) => void
  onGaugeChange: (patch: Partial<GaugeSettings>) => void
  onBackgroundChange: (patch: Partial<PlaymatProject['background']>) => void
  onDeleteZone: () => void
  onDuplicateZone: () => void
  onMoveLayer: (direction: -1 | 1) => void
  onDeleteLogo: () => void
  onDuplicateLogo: () => void
  onMoveLogoLayer: (direction: -1 | 1) => void
  onChooseBackground: () => void
  onChooseLogo: (replace: boolean) => void
  onGeneralColorChange: (color: string) => void
  backgroundDimensions: { width: number; height: number } | null
}

