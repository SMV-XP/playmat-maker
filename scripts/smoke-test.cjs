const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')
const { app, BrowserWindow, dialog } = require('electron')
const { registerFileHandlers } = require('../electron/fileHandlers.cjs')

// Exercise the production renderer and IPC without opening native dialogs.
app.whenReady().then(async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'playmat-smoke-'))
  const projectPath = path.join(directory, 'test.playmat')
  const imagePath = path.join(directory, 'test.png')
  let openPath = projectPath
  let savePath = projectPath
  dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [openPath] })
  dialog.showSaveDialog = async () => ({ canceled: false, filePath: savePath })
  registerFileHandlers()
  const window = new BrowserWindow({
    show: false,
    width: 1540,
    height: 940,
    webPreferences: {
      preload: path.join(__dirname, '../electron/preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false,
    },
  })
  const errors = []
  window.webContents.on('console-message', (_event, level, message) => {
    if (level === 3) errors.push(message)
  })
  const evaluate = (expression) => window.webContents.executeJavaScript(expression, true)
  const waitFor = async (expression) => {
    const deadline = Date.now() + 15000
    while (Date.now() < deadline) {
      if (await evaluate(expression)) return
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    throw new Error(`Timed out: ${expression}`)
  }
  const click = async (text) => {
    await evaluate(`(() => {
      const button = [...document.querySelectorAll('button')]
        .find(node => node.textContent.trim() === ${JSON.stringify(text)});
      if (!button) throw new Error('Missing button: ' + ${JSON.stringify(text)});
      button.click();
    })()`)
  }
  const zoneCount = (count) => waitFor(`document.querySelectorAll('.layer-thumbnail.zone').length === ${count}`)
  try {
    await window.loadFile(path.join(__dirname, '../dist/index.html'))
    await zoneCount(6)
    await waitFor("document.querySelectorAll('canvas').length >= 4")
    await click('＋')
    await waitFor("document.querySelector('.canvas-controls strong').textContent === '110%'")
    await click('Ajustar')
    await waitFor("document.querySelector('.canvas-controls strong').textContent === '100%'")
    await click('# Cuadrícula')
    await waitFor("document.querySelector('.canvas-controls button').classList.contains('active')")
    await click('# Cuadrícula')
    await waitFor("!document.querySelector('.canvas-controls button').classList.contains('active')")
    await click('＋ Agregar al lienzo')
    await zoneCount(7)
    await click('Duplicar')
    await zoneCount(8)
    await click('↶')
    await zoneCount(7)
    await click('↷')
    await zoneCount(8)
    await click('Eliminar zona')
    await zoneCount(7)
    await click('Guardar')
    await waitFor("document.querySelector('.workspace-status').textContent.includes('Guardado:')")
    const saved = JSON.parse(await fs.readFile(projectPath, 'utf8'))
    assert.equal(saved.zones.length, 7)
    await click('Nuevo')
    await zoneCount(6)
    await click('Abrir')
    await zoneCount(7)
    // Presets replace the layout and participate in undo/redo.
    for (const [key, count, visible] of [
      ['withoutTurnOrder', 5, true],
      ['gaugeOnly', 0, true],
      ['empty', 0, false],
      ['all', 6, true],
    ]) {
      await evaluate(`(() => {
        const select = document.querySelector('.playmat-presets select');
        select.value = '${key}';
        select.dispatchEvent(new Event('change', { bubbles: true }));
      })()`)
      await click('Aplicar preset')
      await zoneCount(count)
      await waitFor(`document.querySelector('.layer-thumbnail.gauge').parentElement.querySelector('i').classList.contains('muted') === ${!visible}`)
      if (key === 'withoutTurnOrder') {
        assert.equal(await evaluate("[...document.querySelectorAll('.zone-list strong')].some(node => node.textContent === 'Turn Order')"), false)
      }
    }
    await click('↶')
    await zoneCount(0)
    await waitFor("document.querySelector('.layer-thumbnail.gauge').parentElement.querySelector('i').classList.contains('muted')")
    await click('↷')
    await zoneCount(6)
    await click('Medidor')
    await waitFor("document.querySelector('.panel-heading h2').textContent === 'Medidor de memoria'")
    await click('Fondo')
    await waitFor("document.querySelector('.panel-heading h2').textContent === 'Imagen de fondo'")
    // Generate a real PNG fixture in the renderer for both image import paths.
    const png = await evaluate(`(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 240; canvas.height = 120;
      const ctx = canvas.getContext('2d'); ctx.fillStyle = '#ff8844'; ctx.fillRect(0, 0, 240, 120);
      return canvas.toDataURL('image/png').split(',')[1];
    })()`)
    const fixturePath = path.join(directory, 'fixture.png')
    await fs.writeFile(fixturePath, Buffer.from(png, 'base64'))
    openPath = fixturePath
    await click('Elegir imagen')
    await waitFor("document.querySelector('.workspace-status').textContent.includes('Fondo cargado:')")
    await click('▧ Agregar logo')
    await waitFor("document.querySelectorAll('.layer-thumbnail.logo').length === 1")
    await click('Duplicar')
    await waitFor("document.querySelectorAll('.layer-thumbnail.logo').length === 2")
    await click('Eliminar logo')
    await waitFor("document.querySelectorAll('.layer-thumbnail.logo').length === 1")
    // Wait for image decoding and render before testing full-resolution export.
    await new Promise((resolve) => setTimeout(resolve, 500))
    savePath = imagePath
    await evaluate(`(() => {
      const select = document.querySelector('.export-resolution select');
      select.value = '1'; select.dispatchEvent(new Event('change', { bubbles: true }));
    })()`)
    await click('Exportar PNG ↗')
    await waitFor("document.querySelector('.workspace-status').textContent.includes('Exportado:')")
    const exported = await fs.readFile(imagePath)
    // Konva's existing zoom/pixelRatio calculation can round down by one pixel.
    assert.ok(Math.abs(exported.readUInt32BE(16) - 3675) <= 1)
    assert.ok(Math.abs(exported.readUInt32BE(20) - 2175) <= 1)
    assert.deepEqual(errors, [])
    console.log('PASS: render, zoom, grid, zones, logos, undo/redo, project save/open, properties, image import, PNG export, IPC')
    console.log(`Test artifacts: ${directory}`)
    app.exit(0)
  } catch (error) {
    console.error(error)
    app.exit(1)
  }
}).catch((error) => {
  console.error(error)
  app.exit(1)
})
