import type { PlaymatEditor } from '../../hooks/usePlaymatEditor'
import type { ExportResolutionScale } from '../../editorTypes'

type Props = Pick<
  PlaymatEditor,
  'project'
  | 'commit'
  | 'dirty'
  | 'newProject'
  | 'openProject'
  | 'saveProject'
  | 'past'
  | 'future'
  | 'undo'
  | 'redo'
  | 'exportResolutionScale'
  | 'setExportResolutionScale'
  | 'exportImage'
>

export function EditorToolbar({
  project,
  commit,
  dirty,
  newProject,
  openProject,
  saveProject,
  past,
  future,
  undo,
  redo,
  exportResolutionScale,
  setExportResolutionScale,
  exportImage,
}: Props) {
  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-mark"><span>P</span></div>
        <div><strong>PLAYMAT</strong><small>MAKER</small></div>
      </div>
      <div className="project-title">
        <span>PROYECTO</span>
        <input
          value={project.name}
          onChange={(event) => commit((current) => ({ ...current, name: event.target.value }))}
          aria-label="Nombre del proyecto"
        />
        {dirty && <i title="Cambios sin guardar" />}
      </div>
      <nav className="toolbar">
        <button onClick={newProject} title="Nuevo proyecto">Nuevo</button>
        <button onClick={() => void openProject()} title="Abrir proyecto">Abrir</button>
        <button onClick={() => void saveProject()} title="Guardar (Ctrl+S)">Guardar</button>
        <span className="divider" />
        <button className="icon-button" disabled={!past.length} onClick={undo} title="Deshacer (Ctrl+Z)">↶</button>
        <button className="icon-button" disabled={!future.length} onClick={redo} title="Rehacer (Ctrl+Shift+Z)">↷</button>
        <label className="export-resolution" title="Resolución de la imagen exportada">
          <span>Salida</span>
          <select
            value={exportResolutionScale}
            onChange={(event) => setExportResolutionScale(Number(event.target.value) as ExportResolutionScale)}
          >
            <option value={1}>Estándar · 3675 × 2175 · 150 DPI</option>
            <option value={2}>Imprenta · 7350 × 4350 · 300 DPI</option>
          </select>
        </label>
        <button className="export-button" onClick={() => void exportImage('png')}>Exportar PNG <span>↗</span></button>
      </nav>
    </header>
  )
}
