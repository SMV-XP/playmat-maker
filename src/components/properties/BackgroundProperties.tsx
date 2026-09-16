import type { BackgroundFit } from '../../types'
import type { PropertyPanelProps } from './types'
import { Field, NumberInput, ColorInput } from './Fields'

type Props = Pick<
  PropertyPanelProps,
  'project'
  | 'onBackgroundChange'
  | 'onChooseBackground'
  | 'backgroundDimensions'
>

export function BackgroundProperties({
  project,
  onBackgroundChange,
  onChooseBackground,
  backgroundDimensions,
}: Props) {
  const background = project.background
  return (
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
  )
}
