import { EditorWorkspace } from './components/layout/EditorWorkspace'
import { PropertyPanel } from './components/PropertyPanel'
import { EditorToolbar } from './components/layout/EditorToolbar'
import { LayersPanel } from './components/layout/LayersPanel'
import { usePlaymatEditor } from './hooks/usePlaymatEditor'
import { useEditorShortcuts } from './hooks/useEditorShortcuts'

export default function App() {
  const editor = usePlaymatEditor()
  useEditorShortcuts(editor)
  const {
    project,
    selectedId,
    activeTab,
    setActiveTab,
    backgroundDimensions,
    selectedZone,
    selectedLogo,
    changeZone,
    changeLogo,
    deleteZone,
    duplicateZone,
    moveLayer,
    deleteLogo,
    duplicateLogo,
    moveLogoLayer,
    chooseBackground,
    chooseLogo,
  } = editor

  return (
    <div className="app-shell">
      <EditorToolbar
        project={editor.project}
        commit={editor.commit}
        dirty={editor.dirty}
        newProject={editor.newProject}
        openProject={editor.openProject}
        saveProject={editor.saveProject}
        past={editor.past}
        future={editor.future}
        undo={editor.undo}
        redo={editor.redo}
        exportResolutionScale={editor.exportResolutionScale}
        setExportResolutionScale={editor.setExportResolutionScale}
        exportImage={editor.exportImage}
      />

      <div className="editor-layout">
        <LayersPanel
          project={editor.project}
          activeTab={editor.activeTab}
          setActiveTab={editor.setActiveTab}
          setSelectedId={editor.setSelectedId}
          selectedId={editor.selectedId}
          changeLogo={editor.changeLogo}
          changeZone={editor.changeZone}
          preset={editor.preset}
          setPreset={editor.setPreset}
          addZone={editor.addZone}
          applyPreset={editor.applyPreset}
          chooseLogo={editor.chooseLogo}
        />

        <EditorWorkspace
          project={editor.project}
          selectedId={editor.selectedId}
          activeTab={editor.activeTab}
          zoom={editor.zoom}
          setZoom={editor.setZoom}
          fitScale={editor.fitScale}
          showGrid={editor.showGrid}
          setShowGrid={editor.setShowGrid}
          status={editor.status}
          workspaceRef={editor.workspaceRef}
          canvasRef={editor.canvasRef}
          changeZone={editor.changeZone}
          changeLogo={editor.changeLogo}
          selectCanvasItem={editor.selectCanvasItem}
          repositionBackground={editor.repositionBackground}
          setBackgroundFile={editor.setBackgroundFile}
        />

        <PropertyPanel
          project={project}
          selectedZone={selectedZone}
          selectedLogo={selectedLogo}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onZoneChange={(patch) => selectedId && changeZone(selectedId, patch)}
          onLogoChange={(patch) => selectedId && changeLogo(selectedId, patch)}
          onGaugeChange={editor.changeGauge}
          onBackgroundChange={editor.changeBackground}
          onDeleteZone={deleteZone}
          onDuplicateZone={duplicateZone}
          onMoveLayer={moveLayer}
          onDeleteLogo={deleteLogo}
          onDuplicateLogo={duplicateLogo}
          onMoveLogoLayer={moveLogoLayer}
          onChooseBackground={() => void chooseBackground()}
          onChooseLogo={(replace) => void chooseLogo(replace)}
          backgroundDimensions={backgroundDimensions}
          onGeneralColorChange={editor.changeGeneralColor}
        />
      </div>
    </div>
  )
}
