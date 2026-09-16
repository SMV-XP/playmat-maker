import type { GaugeDesign } from '../../types'
import type { PropertyPanelProps } from './types'
import { Field, NumberInput, ColorInput } from './Fields'

type Props = Pick<
  PropertyPanelProps,
  'project'
  | 'onGaugeChange'
>

export function GaugeProperties({
  project,
  onGaugeChange,
}: Props) {
  const gauge = project.gauge
  return (
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
  )
}
