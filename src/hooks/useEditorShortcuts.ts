import { useEffect } from 'react'
import type { LogoPatch } from '../types'
import type { PlaymatEditor } from './usePlaymatEditor'

type Options = Pick<PlaymatEditor, 'changeLogo' | 'changeZone' | 'deleteLogo' | 'deleteZone' | 'duplicateLogo' | 'duplicateZone' | 'redo' | 'saveProject' | 'selectedId' | 'selectedLogo' | 'selectedZone' | 'undo'>

export function useEditorShortcuts({ changeLogo, changeZone, deleteLogo, deleteZone, duplicateLogo, duplicateZone, redo, saveProject, selectedId, selectedLogo, selectedZone, undo }: Options) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      const editing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault()
        void saveProject()
      } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        if (event.shiftKey) redo()
        else undo()
      } else if (!editing && (event.key === 'Delete' || event.key === 'Backspace')) {
        event.preventDefault()
        if (selectedLogo) deleteLogo()
        else deleteZone()
      } else if (!editing && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'd') {
        event.preventDefault()
        if (selectedLogo) duplicateLogo()
        else duplicateZone()
      } else if (!editing && selectedId && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
        event.preventDefault()
        const distance = event.shiftKey ? 10 : 1
        const item = selectedLogo || selectedZone
        const patch: LogoPatch = {}
        if (event.key === 'ArrowLeft') patch.x = (item?.x || 0) - distance
        if (event.key === 'ArrowRight') patch.x = (item?.x || 0) + distance
        if (event.key === 'ArrowUp') patch.y = (item?.y || 0) - distance
        if (event.key === 'ArrowDown') patch.y = (item?.y || 0) + distance
        if (selectedLogo) changeLogo(selectedId, patch)
        else changeZone(selectedId, patch)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [changeLogo, changeZone, deleteLogo, deleteZone, duplicateLogo, duplicateZone, redo, saveProject, selectedId, selectedLogo, selectedZone, undo])

}
