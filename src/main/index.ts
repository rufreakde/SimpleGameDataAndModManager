import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

import { initTree, loadTree, ExtendedNodeData, saveTree } from './tree'
import { Settings, initSettings } from './settings'

let editorSettings: Settings
let editorTree: ExtendedNodeData

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    // Start Listener:
    editorSettings = initSettings(app.getAppPath())
    editorTree = initTree()
    ipcMain.handle('change:rootDir', settingsChangeRootDir)
    ipcMain.handle('load:tree', treeLoadEventListener)
    ipcMain.handle('click:tree', treeClickedEventListener)
    ipcMain.handle('save:tree', treeSaveEventListener)
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // event wrappers
  async function settingsChangeRootDir() {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory']
    })
    if (!canceled) {
      editorSettings = initSettings(filePaths[0])
      return editorSettings
    }

    return editorSettings
  }
  async function treeLoadEventListener() {
    editorTree = await loadTree(editorTree, editorSettings.paths.root)
    return editorTree
  }

  async function treeClickedEventListener() {
    return editorTree
  }

  async function treeSaveEventListener(_: any, ...args: any) {
    editorTree = args[0] // store to main thread updated
    await saveTree(args[0])
  }

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
