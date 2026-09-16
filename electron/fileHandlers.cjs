const { dialog, ipcMain } = require('electron')
const fs = require('node:fs/promises')
const path = require('node:path')

async function readImageFile(filePath) {
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
}

function registerFileHandlers() {
  ipcMain.handle('background:open', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Elegir imagen de fondo',
      properties: ['openFile'],
      filters: [
        { name: 'Imágenes', extensions: ['png', 'jpg', 'jpeg', 'webp', 'bmp'] },
      ],
    })
    if (result.canceled || !result.filePaths[0]) return null

    return readImageFile(result.filePaths[0])
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

    return readImageFile(result.filePaths[0])
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
}

module.exports = { registerFileHandlers }
