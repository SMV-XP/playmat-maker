import type { PlaymatEditor } from '../../hooks/usePlaymatEditor'
import { useState } from 'react'
import { PLAYMAT_PRESETS, type PlaymatPresetKey, ZONE_PRESETS, type ZonePresetKey } from '../../defaults'

type Props = Pick<
  PlaymatEditor,
  'project'
  | 'activeTab'
  | 'setActiveTab'
  | 'setSelectedId'
  | 'selectedId'
  | 'changeLogo'
  | 'changeZone'
  | 'preset'
  | 'setPreset'
  | 'addZone'
  | 'applyPreset'
  | 'chooseLogo'
>

export function LayersPanel({
  project,
  activeTab,
  setActiveTab,
  setSelectedId,
  selectedId,
  changeLogo,
  changeZone,
  preset,
  setPreset,
  addZone,
  applyPreset,
  chooseLogo,
}: Props) {
  const [playmatPreset, setPlaymatPreset] = useState<PlaymatPresetKey>('all')
  return (
    <aside className="layers-panel">
      <div className="add-zone-card playmat-presets">
        <span>PRESETS</span>
        <select aria-label="Preset del playmat" value={playmatPreset} onChange={(event) => setPlaymatPreset(event.target.value as PlaymatPresetKey)}>
          {Object.entries(PLAYMAT_PRESETS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
        <button onClick={() => applyPreset(playmatPreset)}>Aplicar preset</button>
        <p>Reemplaza zonas, medidor y logos. Conserva el fondo. Podés deshacerlo con Ctrl+Z.</p>
      </div>
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
  )
}
