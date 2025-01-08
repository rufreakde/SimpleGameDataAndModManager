import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

import { NodeData } from 'react-folder-tree';
import * as os from "os";

import * as fs from 'fs';
import path from 'path'

type Dictionary = {
  [key: string]: NodeData | StringDictKVs | null;
};

type StringDictKVs = {
  [key: string]: string
}

const emptyNodeData = (nameOfList: string) : NodeData => {
  return {
    name: nameOfList,
    checked: 0,   // half check: some children are checked
    isOpen: true,   // this folder is opened, we can see it's children
    children: [
    ]
  }
};

// Settings object to send over
async function getSettings() {

  let settings: Dictionary = {
    'paths': {
        'root': `${app.getAppPath()}`
    },
    'game': emptyNodeData("game"),
    'mods': emptyNodeData("mods"),
    'schemas': {},
  }

  if (!settings.paths ){
    alert(`Error no relevant Data found in path location; ${app.getAppPath()}`)
    return settings
  }

  settings.schemas = getSchemas(settings.paths.root )
  settings.game = setAlreadyExistingInstance(settings.paths.root, 'game');
  settings.mods = setAlreadyExistingInstance(settings.paths.root, 'mods');

  return settings;
}

const filehandling = {
  getAllDirectories: (path: string): fs.Dirent[] => fs.readdirSync(path, { 
    encoding: 'utf-8', withFileTypes: true, recursive: true
  }).filter( x => x.isDirectory()),
  getAllYamlFileInstances: (path: string): fs.Dirent[] => fs.readdirSync(path, {
     encoding: 'utf-8', withFileTypes: true, recursive: true
  }).filter( x => x.name.includes('.yaml')),
  getJsonSchemaFileHandles: (path: string): fs.Dirent[] => fs.readdirSync(path, {
    encoding: 'utf-8', withFileTypes: true 
 }).filter( x => x.name.includes('schema.json')),
  isDirectory: (path: string): boolean => fs.lstatSync(path).isDirectory(),
};

async function loadJSON(filename: string) {
  const json = await import(filename, {
    with: { type: 'json' },
  });
 
  return json.default;
}

function AddChildAt(parentsInDepth: NodeData[], childToAdd: NodeData, depth: number){



  // see itself continue
  const foundItselfIndex = parentsInDepth[depth-1].children!.findIndex( (value: NodeData) => { 
    return value.name === childToAdd.name
  })
  if(foundItselfIndex !== -1){
    console.log(`SKIP    \t\t- found itself(${childToAdd.name}))`)
    const itself = parentsInDepth[depth-1].children!.at(foundItselfIndex)
    parentsInDepth.push(itself || childToAdd)
    return
  }
  else {
    parentsInDepth.push(childToAdd)
  }

  parentsInDepth[depth-1].children?.push(childToAdd);
    
}

function getTree(directoryPath: string, files: string[] = [], filterKeyword: string): NodeData {

  const isWindows = os.platform() === "win32";
  const pathDelimiter = isWindows ? "\\" : "/";

  const tree: NodeData = emptyNodeData("root");
  // Get an array of all files and directories in the passed directory using fs.readdirSync
  const schemas = filehandling.getJsonSchemaFileHandles(directoryPath);
  //const directoryList = filehandling.getAllDirectories(directoryPath  + "/Content");
  const instances = filehandling.getAllYamlFileInstances(directoryPath + "/Content")
  // Create the full path of the file/directory by concatenating the passed directory and file/directory name

  // match each instance to a schema
  for (const file of Array.from(schemas)) {

  }

  for (const file of Array.from(instances)) {

    let parentsInDepth: NodeData[] = [];
    parentsInDepth.push(tree);

    const foldersBeginning = file.parentPath.split("Content");

    if (!foldersBeginning[1]){
      alert("Error could not find Content folder!")
      return tree
    }

    const folders = foldersBeginning[1].split(pathDelimiter);
    folders[0] = "Content";
    let DepthCounter = 1;
    for (const folder of folders){
      const childFolder = newChildFolderNode(folder)
      AddChildAt(parentsInDepth, childFolder, DepthCounter)
      DepthCounter++;
    }
    const childInstance = newChildFileNode(file.name)
    AddChildAt(parentsInDepth,  childInstance, DepthCounter)
  }

  return tree
}

// find all files with the following nameing scheme:
// *schema.json
function getSchemas(path: string) : StringDictKVs | null{
  const schemasDict: StringDictKVs | any= {};
  const schemas: string[] = [];
  const tree = getTree(path, schemas, 'schema') // changes schemas value by reference from param

  // TODO make schemas correct this is not so easy but test also if the finding of the schema files is working.
  tree.forEach(schema => {
    const file = loadJSON(schema)
    schemasDict[schema] = file
  });
  return schemasDict
}

function newChildFileNode(fileName: string) :NodeData {
  return  { name: fileName, checked: 0 }
}

function newChildFolderNode(folderName: string) :NodeData{
  return     {
    name: folderName,
    checked: 0,
    isOpen: true,
    children: [],
  }
}

function setAlreadyExistingInstance(path: string, modOrGame: string) : NodeData | null {
  //_settings[modOrGame]?.children[]
  return null
}



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
    // send data to renderer thread
    ipcMain.handle('settings', getSettings);
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

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
