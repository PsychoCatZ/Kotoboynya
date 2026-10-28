const { app, BrowserWindow, dialog, ipcMain, Menu } = require('electron')
const fs = require('node:fs')
const path = require('node:path')

// В Windows путь профиля должен быть коротким и без двоеточия из названия игры.
app.setName('Kotoboynya')
app.setPath('userData', path.join(app.getPath('appData'), 'Kotoboynya'))
const logFile = path.join(app.getPath('userData'), 'kotoboynya-startup.log')

const log = (message, error) => {
  try {
    fs.mkdirSync(app.getPath('userData'), { recursive: true })
    const details = error ? `\n${error.stack || error.message || String(error)}` : ''
    fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${message}${details}\n`)
  } catch { /* Если журнал недоступен, не мешаем запуску игры. */ }
}

process.on('uncaughtException', error => {
  log('Uncaught main-process exception', error)
  dialog.showErrorBox('Котобойня: ошибка запуска', `${error.message}\n\nЖурнал: ${logFile}`)
  app.exit(1)
})
process.on('unhandledRejection', error => log('Unhandled main-process rejection', error))

// Canvas 2D не требует аппаратного ускорения; так обходим сбои ANGLE и драйверов.
app.disableHardwareAcceleration()
log(`Starting Electron ${process.version} on ${process.platform} ${process.arch}`)

let mainWindow = null
const hasSingleInstanceLock = app.requestSingleInstanceLock()

if (!hasSingleInstanceLock) {
  log('Another instance is already running')
  app.quit()
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.show()
    mainWindow.focus()
  })

  const createWindow = () => {
    mainWindow = new BrowserWindow({
      width: 1280,
      height: 800,
      minWidth: 960,
      minHeight: 600,
      show: true,
      autoHideMenuBar: true,
      backgroundColor: '#14211c',
      title: 'Котобойня: Утиный вопрос',
      icon: path.join(__dirname, 'icon.png'),
      webPreferences: {
        preload: path.join(__dirname, 'preload.cjs'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        devTools: false,
      },
    })

    Menu.setApplicationMenu(null)
    mainWindow.on('closed', () => { mainWindow = null })

    mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
    mainWindow.webContents.on('will-navigate', (event, url) => {
      if (url !== mainWindow.webContents.getURL()) event.preventDefault()
    })
    mainWindow.webContents.on('before-input-event', (event, input) => {
      if (input.type === 'keyDown' && input.key === 'F11') {
        event.preventDefault()
        mainWindow.setFullScreen(!mainWindow.isFullScreen())
      }
    })
    mainWindow.webContents.on('did-finish-load', () => log('Game loaded successfully'))
    mainWindow.webContents.on('did-fail-load', (_event, code, description, url) => {
      log(`Load failed ${code}: ${description}; ${url}`)
      dialog.showErrorBox('Котобойня: ошибка загрузки', `${description} (${code})\n\nЖурнал: ${logFile}`)
    })
    mainWindow.webContents.on('render-process-gone', (_event, details) => {
      log(`Renderer stopped: ${details.reason}; exit code ${details.exitCode}`)
      dialog.showErrorBox('Котобойня: сбой отрисовки', `Причина: ${details.reason}\n\nЖурнал: ${logFile}`)
    })

    void mainWindow.loadFile(path.join(__dirname, '../dist/index.html')).catch(error => {
      log('Unable to load game files', error)
      dialog.showErrorBox('Котобойня: файлы игры недоступны', `${error.message}\n\nЖурнал: ${logFile}`)
    })
  }

  app.whenReady().then(() => {
    log('Electron ready')
    app.setAppUserModelId('ru.kotoboynya.utiny-vopros')
    createWindow()
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  }).catch(error => {
    log('Electron initialization failed', error)
    dialog.showErrorBox('Котобойня: ошибка инициализации', `${error.message}\n\nЖурнал: ${logFile}`)
    app.exit(1)
  })

  app.on('window-all-closed', () => app.quit())
  ipcMain.on('app:exit', () => app.quit())
}
