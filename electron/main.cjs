const { app, BrowserWindow } = require('electron')
const path = require('node:path')
const { registerFileHandlers } = require('./fileHandlers.cjs')

const isDevelopment = Boolean(process.env.VITE_DEV_SERVER_URL)

function createWindow() {
  const window = new BrowserWindow({
    width: 1540,
    height: 940,
    minWidth: 1120,
    minHeight: 720,
    backgroundColor: '#0b1019',
    title: 'Playmat Maker',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  if (isDevelopment) {
    window.loadURL(process.env.VITE_DEV_SERVER_URL)
    if (process.env.OPEN_DEVTOOLS === 'true') window.webContents.openDevTools({ mode: 'detach' })
  } else {
    window.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }
}

registerFileHandlers()

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
