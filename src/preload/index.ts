import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { ExtendedNodeData } from '../main/tree'
import { Settings } from '../main/settings'

// Custom APIs for renderer
const api = {}

contextBridge.exposeInMainWorld('electronAPI', {
  settingsChangeRootDir: (): Promise<Settings> => ipcRenderer.invoke('change:rootDir'),
  treeLoadEventListener: (): Promise<ExtendedNodeData> => ipcRenderer.invoke('load:tree'),
  treeClickedEventListener: (treeFromRenderThread: ExtendedNodeData): Promise<ExtendedNodeData> =>
    ipcRenderer.invoke('click:tree', treeFromRenderThread),
  treeSaveEventListener: (treeFromRenderThread: ExtendedNodeData): Promise<ExtendedNodeData> =>
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
