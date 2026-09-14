const { app, BrowserWindow, dialog, ipcMain } = require('electron')
const fs = require('node:fs/promises')
const path = require('node:path')

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

ipcMain.handle('background:open', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Elegir imagen de fondo',
    properties: ['openFile'],
    filters: [
      { name: 'Imágenes', extensions: ['png', 'jpg', 'jpeg', 'webp', 'bmp'] },
    ],
  })
  if (result.canceled || !result.filePaths[0]) return null

  const filePath = result.filePaths[0]
  const extension = path.extname(filePath).toLowerCase()
  const mimeTypes = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.bmp': 'image/bmp',
  }
  const buffer = await fs.readFile(filePath)
  const mime = mimeTypes[extension] || 'application/octet-stream'
  return {
    name: path.basename(filePath),
    dataUrl: `data:${mime};base64,${buffer.toString('base64')}`,
  }
})

ipcMain.handle('logo:open', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Elegir imagen de logo',
    properties: ['openFile'],
    filters: [
      { name: 'Imágenes con transparencia', extensions: ['png', 'webp'] },
      { name: 'Todas las imágenes', extensions: ['png', 'webp', 'jpg', 'jpeg', 'bmp'] },
    ],
  })
  if (result.canceled || !result.filePaths[0]) return null

  const filePath = result.filePaths[0]
  const extension = path.extname(filePath).toLowerCase()
  const mimeTypes = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.bmp': 'image/bmp',
  }
  const buffer = await fs.readFile(filePath)
  const mime = mimeTypes[extension] || 'application/octet-stream'
  return {
    name: path.basename(filePath),
    dataUrl: `data:${mime};base64,${buffer.toString('base64')}`,
  }
})

ipcMain.handle('project:open', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Abrir proyecto de playmat',
    properties: ['openFile'],
    filters: [{ name: 'Proyecto Playmat Maker', extensions: ['playmat', 'json'] }],
  })
  if (result.canceled || !result.filePaths[0]) return null
  const filePath = result.filePaths[0]
  return {
    name: path.basename(filePath),
    content: await fs.readFile(filePath, 'utf8'),
  }
})

ipcMain.handle('project:save', async (_event, payload) => {
  const result = await dialog.showSaveDialog({
    title: 'Guardar proyecto de playmat',
    defaultPath: `${payload.suggestedName || 'Mi playmat'}.playmat`,
    filters: [{ name: 'Proyecto Playmat Maker', extensions: ['playmat'] }],
  })
  if (result.canceled || !result.filePath) return null
  await fs.writeFile(result.filePath, payload.content, 'utf8')
  return { filePath: result.filePath, name: path.basename(result.filePath) }
})

ipcMain.handle('image:export', async (_event, payload) => {
  const extension = payload.format === 'jpeg' ? 'jpg' : 'png'
  const result = await dialog.showSaveDialog({
    title: 'Exportar playmat',
    defaultPath: `${payload.suggestedName || 'Mi playmat'}.${extension}`,
    filters: [
      payload.format === 'jpeg'
        ? { name: 'Imagen JPEG', extensions: ['jpg', 'jpeg'] }
        : { name: 'Imagen PNG', extensions: ['png'] },
    ],
  })
  if (result.canceled || !result.filePath) return null

  const base64 = payload.dataUrl.replace(/^data:image\/(png|jpeg);base64,/, '')
  await fs.writeFile(result.filePath, Buffer.from(base64, 'base64'))
  return { filePath: result.filePath, name: path.basename(result.filePath) }
})

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
