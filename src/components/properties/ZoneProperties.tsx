import type { ZoneStyle, ZoneTemplate } from '../../types'
import type { PropertyPanelProps } from './types'
import { Field, NumberInput, ColorInput } from './Fields'

const PSD_STYLE_BY_TEMPLATE: Record<Exclude<ZoneTemplate, null>, ZoneStyle> = {
  security: 'stack',
  breeding: 'breeding',
  battle: 'banner',
  deck: 'frame',
  trash: 'frame',
  'turn-order': 'frame',
}

type Props = Pick<
  PropertyPanelProps,
  'selectedZone'
  | 'onZoneChange'
  | 'onDuplicateZone'
  | 'onMoveLayer'
  | 'onDeleteZone'
>

export function ZoneProperties({
  selectedZone,
  onZoneChange,
  onDuplicateZone,
  onMoveLayer,
  onDeleteZone,
}: Props) {
  return (
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
  )
}
