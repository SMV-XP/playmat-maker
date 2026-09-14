const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('playmat', {
  openBackground: () => ipcRenderer.invoke('background:open'),
  openLogo: () => ipcRenderer.invoke('logo:open'),
  openProject: () => ipcRenderer.invoke('project:open'),
  saveProject: (payload) => ipcRenderer.invoke('project:save', payload),
  exportImage: (payload) => ipcRenderer.invoke('image:export', payload),
})
