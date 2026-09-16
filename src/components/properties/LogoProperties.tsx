import type { PropertyPanelProps } from './types'
import { Field, NumberInput } from './Fields'

type Props = Pick<
  PropertyPanelProps,
  'selectedLogo'
  | 'onLogoChange'
  | 'onChooseLogo'
  | 'onDuplicateLogo'
  | 'onMoveLogoLayer'
  | 'onDeleteLogo'
>

export function LogoProperties({
  selectedLogo,
  onLogoChange,
  onChooseLogo,
  onDuplicateLogo,
  onMoveLogoLayer,
  onDeleteLogo,
}: Props) {
  return (
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
  )
}
