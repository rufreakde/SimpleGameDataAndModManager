import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

import { NodeData } from 'react-folder-tree';
import * as os from "os";

import * as fs from 'fs';
import path from 'path'
import { parse } from 'yaml'

type Dictionary = {
  [key: string]: NodeData | StringDictKVs | null;
};

interface Schema {
  name: string;
  path: string;
  referenceData: any;
}

interface ExtendedNodeData extends NodeData {
  path?: string;
  isFolder?: boolean;
  jsonSchema?: Schema;
  instanceData?: any;
}

type StringDictKVs = {
  [key: string]: string
}

const emptyFolderNodeData = (nameOfList: string) : ExtendedNodeData => {
  return {
    name: nameOfList,
    path: 'NA',
    isFolder: true,
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
    'tree':  emptyFolderNodeData("root"),
  }

  if (!settings.paths ){
    alert(`Error no relevant Data found in path location; ${app.getAppPath()}`)
    return settings
  }

  settings.tree = await getTree( settings.paths.root )

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

// function saveJSONData(data, filePath) {
//   const text = JSON.stringify(data)
//   fs.writeFileSync(filePath, text);
// }

function loadJSONData(filePath) {
  const buffer = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(buffer)
}

// function saveYAMLData(data, filePath) {
//   const text = stringify(data)
//   fs.writeFileSync(filePath, text);
// }

function loadYAMLData(filePath) {
  const buffer = fs.readFileSync(filePath, 'utf8');
  return parse(buffer)
}

function AddChildAt(parentsInDepth: ExtendedNodeData[], childToAdd: ExtendedNodeData, depth: number){

  // see itself continue
  const foundItselfIndex = parentsInDepth[depth-1].children!.findIndex( (value: ExtendedNodeData) => { 
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

async function getTree(directoryPath: string): Promise<ExtendedNodeData> {

  const isWindows = os.platform() === "win32";
  const pathDelimiter = isWindows ? "\\" : "/";
  const schemasDict: StringDictKVs | any= {};

  const tree: NodeData = emptyFolderNodeData("root");
  // Get an array of all files and directories in the passed directory using fs.readdirSync
  const schemas = filehandling.getJsonSchemaFileHandles(directoryPath);
  //const directoryList = filehandling.getAllDirectories(directoryPath  + "/Content");
  const instances = filehandling.getAllYamlFileInstances(directoryPath + "/Content")
  // Create the full path of the file/directory by concatenating the passed directory and file/directory name

  // match each instance to a schema
  for (const fileHandle of Array.from(schemas)) {
    const file = await loadJSONData( path.join(fileHandle.parentPath ,fileHandle.name))
    schemasDict[fileHandle.name] = file;
  }

  for (const file of Array.from(instances)) {

    let parentsInDepth: ExtendedNodeData[] = [];
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
      const childFolder = newChildFolderNode(folder, `TODO PATH`) // TODO construct the folder paths so that we dont loose filesystem references makes it simpler later
      AddChildAt(parentsInDepth, childFolder, DepthCounter)
      DepthCounter++;
    }
    const childInstanceMatchedSchema = await findSchemaByChildParentFolder(schemasDict, file, pathDelimiter);
    const childInstanceData = await loadYAMLData( path.join(file.parentPath, file.name))
    const childInstance = newChildFileNode(file.name, file.parentPath, childInstanceData, childInstanceMatchedSchema.name, childInstanceMatchedSchema.path, childInstanceMatchedSchema.referenceData);
    AddChildAt(parentsInDepth,  childInstance, DepthCounter);
  }

  return tree
}

async function findSchemaByChildParentFolder(schemasDict: StringDictKVs | any, instanceFileInfo: fs.Dirent, pathDelimiter ) : Promise<Schema> {
  // from the path find the parent folder and use that as key to get the schema
  const folders = instanceFileInfo.parentPath.split(pathDelimiter);
  const schemaKeys = Object.keys(schemasDict)

  const nameSplitByDot = instanceFileInfo.name.split(".");
  const fileTypeSchemaSuffix = nameSplitByDot[nameSplitByDot.length-2]

  const schemaKey = schemaKeys.find( ( key ) => { 

    const folderKey = folders.find( ( folder ) => { 
      const schemaKey = schemaKeys.find( 
        (key) =>{ 
          return folder.includes( key.split(".")[0] ) 
        } 
      )?.split(".")[0]
    
      return folder.includes(schemaKey || "not found");
    })
    const removedPlural = folderKey?.slice(0, -1) || "not found"
    return key.includes(removedPlural) && key.includes(fileTypeSchemaSuffix) 
  } )

  if ( schemaKey ){
    return {
      name: schemaKey,
      path: "NOT IMPLEMENTED YET",
      referenceData : schemasDict[schemaKey]
  
    }
  }

  return {
    name: "Not Found",
    path: "NOT IMPLEMENTED YET",
    referenceData : schemasDict[0]

  } // fallback
}

function newChildFileNode(fileName: string, path: string, instanceData:any, schemaName: string, schemaPath: string, schemaData: any) :ExtendedNodeData {
  return  { 
    name: fileName, 
    isFolder: false, 
    path: path, 
    instanceData: instanceData,
    jsonSchema: { 
      name: schemaName, 
      path: schemaPath, 
      referenceData: schemaData}, 
      checked: 0 
    }
}

function newChildFolderNode(folderName: string, path: string) :ExtendedNodeData{
  return     {
    name: folderName,
    isFolder: true,
    path: path,
    checked: 0,
    isOpen: true,
    children: [],
  }
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
