import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { ExtendedNodeData } from '../main/tree'

// Custom APIs for renderer
const api = {}

contextBridge.exposeInMainWorld('electronAPI', {
  settingsChangeRootDir: () => ipcRenderer.invoke('change:rootDir'),
  treeLoadEventListener: () => ipcRenderer.invoke('load:tree'),
  treeClickedEventListener: () => ipcRenderer.invoke('click:tree'),
  treeSaveEventListener: (treeFromRenderThread: ExtendedNodeData) =>
    ipcRenderer.invoke('save:tree', treeFromRenderThread)
})

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
