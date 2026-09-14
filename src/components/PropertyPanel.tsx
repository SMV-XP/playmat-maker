import type { BackgroundFit, GaugeDesign, GaugeSettings, Logo, LogoPatch, PlaymatProject, Zone, ZonePatch, ZoneStyle, ZoneTemplate } from '../types'

const PSD_STYLE_BY_TEMPLATE: Record<Exclude<ZoneTemplate, null>, ZoneStyle> = {
  security: 'stack',
  breeding: 'breeding',
  battle: 'banner',
  deck: 'frame',
  trash: 'frame',
  'turn-order': 'frame',
}

interface Props {
  project: PlaymatProject
  selectedZone: Zone | null
  selectedLogo: Logo | null
  activeTab: 'zone' | 'logo' | 'gauge' | 'canvas'
  onTabChange: (tab: 'zone' | 'logo' | 'gauge' | 'canvas') => void
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

function Field({ label, children, wide = false }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <label className={`field${wide ? ' field-wide' : ''}`}>
      <span>{label}</span>
      {children}
    </label>
  )
}

function NumberInput({ value, onChange, min, max, step = 1 }: {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
}) {
  return (
    <input
      type="number"
      value={Math.round(value * 100) / 100}
      min={min}
      max={max}
      step={step}
      onChange={(event) => onChange(Number(event.target.value))}
    />
  )
}

function ColorInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="color-field">
      <input
        type="color"
        value={value}
        onInput={(event) => onChange(event.currentTarget.value)}
        onChange={(event) => onChange(event.currentTarget.value)}
      />
      <span>{value.toUpperCase()}</span>
    </div>
  )
}

export function PropertyPanel({
  project,
  selectedZone,
  selectedLogo,
  activeTab,
  onTabChange,
  onZoneChange,
  onLogoChange,
  onGaugeChange,
  onBackgroundChange,
  onDeleteZone,
  onDuplicateZone,
  onMoveLayer,
  onDeleteLogo,
  onDuplicateLogo,
  onMoveLogoLayer,
  onChooseBackground,
  onChooseLogo,
  onGeneralColorChange,
  backgroundDimensions,
}: Props) {
  const gauge = project.gauge
  const background = project.background

  return (
    <aside className="properties-panel">
      <div className="global-color-control">
        <div>
          <strong>COLOR GENERAL</strong>
          <small>Zonas + Memory Gauge</small>
        </div>
        <ColorInput value={gauge.rightFill} onChange={onGeneralColorChange} />
      </div>
      <div className="property-tabs">
        <button className={activeTab === 'zone' ? 'active' : ''} onClick={() => onTabChange('zone')}>Zona</button>
        <button className={activeTab === 'logo' ? 'active' : ''} onClick={() => onTabChange('logo')}>Logo</button>
        <button className={activeTab === 'gauge' ? 'active' : ''} onClick={() => onTabChange('gauge')}>Medidor</button>
        <button className={activeTab === 'canvas' ? 'active' : ''} onClick={() => onTabChange('canvas')}>Fondo</button>
      </div>

      <div className="property-scroll">
        {activeTab === 'zone' && (
          selectedZone ? (
            <>
              <div className="panel-heading">
                <div><small>EDITANDO ZONA</small><h2>{selectedZone.label}</h2></div>
                <span className="status-dot" />
              </div>
              <section className="property-section">
                <h3>Contenido</h3>
                <Field label="Nombre" wide>
                  <input value={selectedZone.label} onChange={(event) => onZoneChange({ label: event.target.value })} />
                </Field>
                <Field label="Diseño" wide>
                  <select
                    value={selectedZone.template ? `psd:${selectedZone.template}` : `custom:${selectedZone.style}`}
                    onChange={(event) => {
                      const [kind, value] = event.target.value.split(':') as ['psd' | 'custom', string]
                      if (kind === 'psd') {
                        const template = value as Exclude<ZoneTemplate, null>
                        onZoneChange({ template, style: PSD_STYLE_BY_TEMPLATE[template] })
                      } else {
                        onZoneChange({ template: null, style: value as ZoneStyle })
                      }
                    }}
                  >
                    <optgroup label="Diseños Standard">
                      <option value="psd:security">Standard · Security Stack</option>
                      <option value="psd:breeding">Standard · Breeding area</option>
                      <option value="psd:battle">Standard · Battle area</option>
                      <option value="psd:deck">Standard · Deck</option>
                      <option value="psd:trash">Standard · Trash</option>
                      <option value="psd:turn-order">Standard · Turn Order</option>
                    </optgroup>
                    <optgroup label="Formas personalizadas">
                      <option value="custom:frame">Marco</option>
                      <option value="custom:stack">Pila de cartas</option>
                      <option value="custom:breeding">Área de crianza</option>
                      <option value="custom:banner">Etiqueta horizontal</option>
                      <option value="custom:oval">Óvalo</option>
                    </optgroup>
                  </select>
                </Field>
                {selectedZone.template && (
                  <div className="drag-callout"><strong>Diseño Standard</strong><span>Usa los píxeles, transparencias y proporciones de la plantilla original.</span></div>
                )}
              </section>

              <section className="property-section">
                <h3>Posición y tamaño</h3>
                <div className="field-grid">
                  <Field label="X"><NumberInput value={selectedZone.x} onChange={(x) => onZoneChange({ x })} /></Field>
                  <Field label="Y"><NumberInput value={selectedZone.y} onChange={(y) => onZoneChange({ y })} /></Field>
                  <Field label="Ancho"><NumberInput value={selectedZone.width} min={120} onChange={(width) => onZoneChange({ width })} /></Field>
                  <Field label="Alto"><NumberInput value={selectedZone.height} min={90} onChange={(height) => onZoneChange({ height })} /></Field>
                  <Field label="Rotación"><NumberInput value={selectedZone.rotation} min={-180} max={180} onChange={(rotation) => onZoneChange({ rotation })} /></Field>
                  {!selectedZone.template && <Field label="Radio"><NumberInput value={selectedZone.radius} min={0} max={200} onChange={(radius) => onZoneChange({ radius })} /></Field>}
                </div>
              </section>

              <section className="property-section">
                <h3>Apariencia</h3>
                <Field label="Borde" wide><ColorInput value={selectedZone.stroke} onChange={(stroke) => onZoneChange({ stroke })} /></Field>
                <Field label="Relleno" wide><ColorInput value={selectedZone.fill} onChange={(fill) => onZoneChange({ fill })} /></Field>
                <Field label="Texto" wide><ColorInput value={selectedZone.textColor} onChange={(textColor) => onZoneChange({ textColor })} /></Field>
                <div className="field-grid">
                  {!selectedZone.template && <Field label="Grosor"><NumberInput value={selectedZone.strokeWidth} min={1} max={30} onChange={(strokeWidth) => onZoneChange({ strokeWidth })} /></Field>}
                  <Field label="Texto px"><NumberInput value={selectedZone.fontSize} min={18} max={180} onChange={(fontSize) => onZoneChange({ fontSize })} /></Field>
                </div>
                <Field label={`Opacidad del relleno ${Math.round(selectedZone.fillOpacity * 100)}%`} wide>
                  <input type="range" min="0" max="1" step="0.01" value={selectedZone.fillOpacity} onChange={(event) => onZoneChange({ fillOpacity: Number(event.target.value) })} />
                </Field>
                <label className="check-row">
                  <input type="checkbox" checked={selectedZone.visible} onChange={(event) => onZoneChange({ visible: event.target.checked })} />
                  <span><strong>Mostrar zona</strong><small>Incluye esta capa en la exportación.</small></span>
                </label>
                <label className="check-row">
                  <input type="checkbox" checked={selectedZone.locked} onChange={(event) => onZoneChange({ locked: event.target.checked })} />
                  <span><strong>Bloquear posición</strong><small>Evita mover o redimensionar por accidente.</small></span>
                </label>
              </section>

              <section className="property-section compact-actions">
                <button onClick={onDuplicateZone}>Duplicar</button>
                <button onClick={() => onMoveLayer(1)}>Traer al frente</button>
                <button onClick={() => onMoveLayer(-1)}>Enviar atrás</button>
                <button className="danger" onClick={onDeleteZone}>Eliminar zona</button>
              </section>
            </>
          ) : (
            <div className="empty-panel">
              <div className="empty-icon">◇</div>
              <h2>Seleccioná una zona</h2>
              <p>Hacé clic sobre una zona del playmat o elegila desde la lista de capas.</p>
            </div>
          )
        )}

        {activeTab === 'logo' && (
          selectedLogo ? (
            <>
              <div className="panel-heading">
                <div><small>CAPA DE IMAGEN</small><h2>{selectedLogo.fileName}</h2></div>
                <span className="status-dot" />
              </div>
              <section className="property-section">
                <div className="logo-preview-card"><img src={selectedLogo.dataUrl} alt="Logo seleccionado" /></div>
                <button className="primary full" onClick={() => onChooseLogo(true)}>Reemplazar imagen</button>
              </section>
              <section className="property-section">
                <h3>Posición y tamaño</h3>
                <div className="field-grid">
                  <Field label="X"><NumberInput value={selectedLogo.x} onChange={(x) => onLogoChange({ x })} /></Field>
                  <Field label="Y"><NumberInput value={selectedLogo.y} onChange={(y) => onLogoChange({ y })} /></Field>
                  <Field label="Ancho"><NumberInput value={selectedLogo.width} min={80} onChange={(width) => onLogoChange({ width })} /></Field>
                  <Field label="Alto"><NumberInput value={selectedLogo.height} min={40} onChange={(height) => onLogoChange({ height })} /></Field>
                  <Field label="Rotación"><NumberInput value={selectedLogo.rotation} min={-180} max={180} onChange={(rotation) => onLogoChange({ rotation })} /></Field>
                </div>
                <Field label={`Opacidad ${Math.round(selectedLogo.opacity * 100)}%`} wide>
                  <input type="range" min="0.05" max="1" step="0.01" value={selectedLogo.opacity} onChange={(event) => onLogoChange({ opacity: Number(event.target.value) })} />
                </Field>
                <label className="check-row">
                  <input type="checkbox" checked={selectedLogo.visible} onChange={(event) => onLogoChange({ visible: event.target.checked })} />
                  <span><strong>Mostrar logo</strong><small>Incluye la imagen en la exportación.</small></span>
                </label>
                <label className="check-row">
                  <input type="checkbox" checked={selectedLogo.locked} onChange={(event) => onLogoChange({ locked: event.target.checked })} />
                  <span><strong>Bloquear posición</strong><small>Conserva el tamaño y la ubicación.</small></span>
                </label>
              </section>
              <section className="property-section compact-actions">
                <button onClick={onDuplicateLogo}>Duplicar</button>
                <button onClick={() => onMoveLogoLayer(1)}>Traer al frente</button>
                <button onClick={() => onMoveLogoLayer(-1)}>Enviar atrás</button>
                <button className="danger" onClick={onDeleteLogo}>Eliminar logo</button>
              </section>
            </>
          ) : (
            <div className="empty-panel">
              <div className="empty-icon">▧</div>
              <h2>Agregá un logo</h2>
              <p>Usá PNG o WebP con transparencia. Después vas a poder moverlo, escalarlo y rotarlo.</p>
              <button className="primary empty-action" onClick={() => onChooseLogo(false)}>Elegir imagen</button>
            </div>
          )
        )}

        {activeTab === 'gauge' && (
          <>
            <div className="panel-heading">
              <div><small>MEMORY GAUGE</small><h2>Medidor de memoria</h2></div>
              <label className="switch"><input type="checkbox" checked={gauge.visible} onChange={(event) => onGaugeChange({ visible: event.target.checked })} /><span /></label>
            </div>
            <section className="property-section">
              <Field label="Diseño" wide>
                <select value={gauge.design} onChange={(event) => onGaugeChange({ design: event.target.value as GaugeDesign })}>
                  <option value="standard">Standard (actual)</option>
                  <option value="players-sides">Players laterales</option>
                  <option value="players-below">Players debajo</option>
                </select>
              </Field>
              <div className="drag-callout">
                <strong>{gauge.design === 'players-sides' ? 'Players laterales' : gauge.design === 'players-below' ? 'Players debajo' : 'Diseño Standard'}</strong>
                <span>{gauge.design === 'standard' ? 'Conserva el medidor actual sin etiquetas de jugadores.' : 'Reproduce las placas de referencia con colores de fondo y texto independientes.'}</span>
              </div>
              <h3>Colores</h3>
              <Field label="Lado izquierdo" wide><ColorInput value={gauge.leftFill} onChange={(leftFill) => onGaugeChange({ leftFill })} /></Field>
              <Field label="Lado derecho" wide><ColorInput value={gauge.rightFill} onChange={(rightFill) => onGaugeChange({ rightFill })} /></Field>
              <Field label="Texto izquierdo" wide><ColorInput value={gauge.leftText} onChange={(leftText) => onGaugeChange({ leftText })} /></Field>
              <Field label="Texto derecho" wide><ColorInput value={gauge.rightText} onChange={(rightText) => onGaugeChange({ rightText })} /></Field>
              {gauge.design !== 'standard' && (
                <>
                  <h3>Etiquetas de jugadores</h3>
                  <Field label="PLAYER 1 · Fondo" wide><ColorInput value={gauge.playerOneFill ?? gauge.rightFill} onChange={(playerOneFill) => onGaugeChange({ playerOneFill })} /></Field>
                  <Field label="PLAYER 1 · Texto" wide><ColorInput value={gauge.playerOneText ?? gauge.rightText} onChange={(playerOneText) => onGaugeChange({ playerOneText })} /></Field>
                  <Field label="PLAYER 2 · Fondo" wide><ColorInput value={gauge.playerTwoFill ?? gauge.leftFill} onChange={(playerTwoFill) => onGaugeChange({ playerTwoFill })} /></Field>
                  <Field label="PLAYER 2 · Texto" wide><ColorInput value={gauge.playerTwoText ?? gauge.leftText} onChange={(playerTwoText) => onGaugeChange({ playerTwoText })} /></Field>
                </>
              )}
            </section>
            <section className="property-section">
              <h3>Disposición</h3>
              <div className="field-grid">
                <Field label="X"><NumberInput value={gauge.x} onChange={(x) => onGaugeChange({ x })} /></Field>
                <Field label="Y"><NumberInput value={gauge.y} onChange={(y) => onGaugeChange({ y })} /></Field>
                <Field label="Ancho"><NumberInput value={gauge.width} min={1800} max={3600} onChange={(width) => onGaugeChange({ width })} /></Field>
              </div>
              <Field label={`Opacidad ${Math.round(gauge.opacity * 100)}%`} wide>
                <input type="range" min="0.1" max="1" step="0.01" value={gauge.opacity} onChange={(event) => onGaugeChange({ opacity: Number(event.target.value) })} />
              </Field>
            </section>
          </>
        )}

        {activeTab === 'canvas' && (
          <>
            <div className="panel-heading">
              <div><small>LIENZO</small><h2>Imagen de fondo</h2></div>
            </div>
            <section className="property-section">
              <div className="background-card">
                {background.dataUrl ? <img src={background.dataUrl} alt="Fondo" /> : <div className="background-placeholder">Sin imagen</div>}
                <div>
                  <strong>{background.fileName || 'Fondo generado'}</strong>
                  <small>{backgroundDimensions ? `${backgroundDimensions.width} × ${backgroundDimensions.height} px` : '3675 × 2175 px'}</small>
                </div>
              </div>
              <button className="primary full" onClick={onChooseBackground}>Elegir imagen</button>
              {background.dataUrl && <button className="secondary full" onClick={() => onBackgroundChange({ dataUrl: null, fileName: '' })}>Quitar imagen</button>}
              {background.dataUrl && (
                <div className="drag-callout"><strong>Modo mover fondo activo</strong><span>Arrastrá la imagen directamente sobre el lienzo para centrarla.</span></div>
              )}
            </section>
            <section className="property-section">
              <h3>Ajuste</h3>
              <Field label="Encaje" wide>
                <select value={background.fit} onChange={(event) => onBackgroundChange({ fit: event.target.value as BackgroundFit })}>
                  <option value="cover">Cubrir lienzo</option>
                  <option value="contain">Mostrar completa</option>
                  <option value="stretch">Estirar</option>
                </select>
              </Field>
              <div className="field-grid">
                <Field label="Despl. X"><NumberInput value={background.offsetX} onChange={(offsetX) => onBackgroundChange({ offsetX })} /></Field>
                <Field label="Despl. Y"><NumberInput value={background.offsetY} onChange={(offsetY) => onBackgroundChange({ offsetY })} /></Field>
              </div>
              {background.fit !== 'stretch' && (
                <Field label={`Escala ${Math.round(background.scale * 100)}%`} wide>
                  <input type="range" min="0.5" max="2.5" step="0.01" value={background.scale} onChange={(event) => onBackgroundChange({ scale: Number(event.target.value) })} />
                </Field>
              )}
              <Field label={`Opacidad ${Math.round(background.opacity * 100)}%`} wide>
                <input type="range" min="0" max="1" step="0.01" value={background.opacity} onChange={(event) => onBackgroundChange({ opacity: Number(event.target.value) })} />
              </Field>
            </section>
            <section className="property-section">
              <h3>Fondo sin imagen</h3>
              <Field label="Color inicial" wide><ColorInput value={background.fallbackA} onChange={(fallbackA) => onBackgroundChange({ fallbackA })} /></Field>
              <Field label="Color final" wide><ColorInput value={background.fallbackB} onChange={(fallbackB) => onBackgroundChange({ fallbackB })} /></Field>
            </section>
          </>
        )}
      </div>
    </aside>
  )
}
