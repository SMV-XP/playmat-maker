import { EditorCanvas } from '../EditorCanvas'
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '../../types'
import type { PlaymatEditor } from '../../hooks/usePlaymatEditor'

type Props = Pick<
  PlaymatEditor,
  'project'
  | 'selectedId'
  | 'activeTab'
  | 'zoom'
  | 'setZoom'
  | 'fitScale'
  | 'showGrid'
  | 'setShowGrid'
  | 'status'
  | 'workspaceRef'
  | 'canvasRef'
  | 'changeZone'
  | 'changeLogo'
  | 'selectCanvasItem'
  | 'repositionBackground'
  | 'setBackgroundFile'
>

export function EditorWorkspace({
  project,
  selectedId,
  activeTab,
  zoom,
  setZoom,
  fitScale,
  showGrid,
  setShowGrid,
  status,
  workspaceRef,
  canvasRef,
  changeZone,
  changeLogo,
  selectCanvasItem,
  repositionBackground,
  setBackgroundFile,
}: Props) {
  return (
    <main className="workspace" ref={workspaceRef}>
      <div className="workspace-meta">
        <span>LIENZO <strong>{CANVAS_WIDTH} × {CANVAS_HEIGHT} px</strong></span>
        <span className="workspace-status"><i /> {status}</span>
      </div>
      <div className="canvas-scroll">
        <EditorCanvas
          ref={canvasRef}
          project={project}
          selectedId={selectedId}
          scale={fitScale * zoom}
          showGrid={showGrid}
          backgroundEditMode={activeTab === 'canvas'}
          onSelect={selectCanvasItem}
          onChangeZone={changeZone}
          onChangeLogo={changeLogo}
          onChangeBackground={repositionBackground}
          onDropBackground={(file) => void setBackgroundFile(file)}
        />
      </div>
      <div className="canvas-controls">
        <button className={showGrid ? 'active' : ''} onClick={() => setShowGrid((value) => !value)}># Cuadrícula</button>
        <span />
        <button onClick={() => setZoom(1)}>Ajustar</button>
        <button onClick={() => setZoom((value) => Math.max(0.5, value - 0.1))}>−</button>
        <strong>{Math.round(zoom * 100)}%</strong>
        <button onClick={() => setZoom((value) => Math.min(2.2, value + 0.1))}>＋</button>
      </div>
    </main>
  )
}
