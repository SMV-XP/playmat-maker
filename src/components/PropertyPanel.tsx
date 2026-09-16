import type { PropertyPanelProps } from './properties/types'
import { ColorInput } from './properties/Fields'
import { ZoneProperties } from './properties/ZoneProperties'
import { LogoProperties } from './properties/LogoProperties'
import { GaugeProperties } from './properties/GaugeProperties'
import { BackgroundProperties } from './properties/BackgroundProperties'

export function PropertyPanel(props: PropertyPanelProps) {
  return (
    <aside className="properties-panel">
      <div className="global-color-control">
        <div>
          <strong>COLOR GENERAL</strong>
          <small>Zonas + Memory Gauge</small>
        </div>
        <ColorInput value={props.project.gauge.rightFill} onChange={props.onGeneralColorChange} />
      </div>
      <div className="property-tabs">
        <button className={props.activeTab === 'zone' ? 'active' : ''} onClick={() => props.onTabChange('zone')}>Zona</button>
        <button className={props.activeTab === 'logo' ? 'active' : ''} onClick={() => props.onTabChange('logo')}>Logo</button>
        <button className={props.activeTab === 'gauge' ? 'active' : ''} onClick={() => props.onTabChange('gauge')}>Medidor</button>
        <button className={props.activeTab === 'canvas' ? 'active' : ''} onClick={() => props.onTabChange('canvas')}>Fondo</button>
      </div>

      <div className="property-scroll">
        {props.activeTab === 'zone' && <ZoneProperties selectedZone={props.selectedZone} onZoneChange={props.onZoneChange} onDuplicateZone={props.onDuplicateZone} onMoveLayer={props.onMoveLayer} onDeleteZone={props.onDeleteZone} />}
        {props.activeTab === 'logo' && <LogoProperties selectedLogo={props.selectedLogo} onLogoChange={props.onLogoChange} onChooseLogo={props.onChooseLogo} onDuplicateLogo={props.onDuplicateLogo} onMoveLogoLayer={props.onMoveLogoLayer} onDeleteLogo={props.onDeleteLogo} />}
        {props.activeTab === 'gauge' && <GaugeProperties project={props.project} onGaugeChange={props.onGaugeChange} />}
        {props.activeTab === 'canvas' && <BackgroundProperties project={props.project} onBackgroundChange={props.onBackgroundChange} onChooseBackground={props.onChooseBackground} backgroundDimensions={props.backgroundDimensions} />}
      </div>
    </aside>
  )
}
