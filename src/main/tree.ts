import { NodeData } from 'react-folder-tree'
import * as os from 'os'

import * as fs from 'fs'
import path from 'path'

import filehandling from './filehandling'

export type Dictionary = {
  [key: string]: NodeData | StringDictKVs | null
}

export interface Schema {
  schemaName: string
  fullFolderPath: string
  referenceData: any
}

export interface customDataHolder {
  fullFolderPath?: string
  isFolder?: boolean
  jsonSchema?: Schema
  instanceData?: any
}

export interface ExtendedNodeData extends NodeData {
  customDataHolder?: customDataHolder
}

export type StringDictKVs = {
  [key: string]: string
}

export const emptyFolderNodeData = (nameOfList: string): ExtendedNodeData => {
  return {
    _id: 0,
    name: nameOfList,
    children: []
  }
}

function AddChildAt(
  createdItemsCounter: number,
  parentsInDepth: ExtendedNodeData[],
  childToAdd: ExtendedNodeData,
  depth: number
): number {
  // see itself continue
  const foundItselfIndex = parentsInDepth[depth - 1].children!.findIndex(
    (value: ExtendedNodeData) => {
      return value.name === childToAdd.name
    }
  )
  if (foundItselfIndex !== -1) {
    //console.log(`SKIP    \t\t- found itself(${childToAdd.name}))`)
    const itself = parentsInDepth[depth - 1].children!.at(foundItselfIndex)
    parentsInDepth.push(itself || childToAdd)
    return createdItemsCounter
  } else {
    parentsInDepth.push(childToAdd)
  }

  parentsInDepth[depth - 1].children?.push(childToAdd)
  return createdItemsCounter + 1
}

export async function getTree(directoryPath: string): Promise<ExtendedNodeData> {
  const isWindows = os.platform() === 'win32'
  const pathDelimiter = isWindows ? '\\' : '/'
  const schemasDict: StringDictKVs | any = {}

  const tree: ExtendedNodeData = emptyFolderNodeData('root')
  // Get an array of all files and directories in the passed directory using fs.readdirSync
  const schemas = filehandling.getJsonSchemaFileHandles(directoryPath)
  //const directoryList = filehandling.getAllDirectories(directoryPath  + "/Content");
  const instances = filehandling.getAllYamlFileInstances(directoryPath + '/Content')
  // Create the full path of the file/directory by concatenating the passed directory and file/directory name

  let createdItemsCounter = 1

  // match each instance to a schema
  for (const fileHandle of Array.from(schemas)) {
    const file = await filehandling.loadJSONData(path.join(fileHandle.parentPath, fileHandle.name))
    schemasDict[fileHandle.name] = file
  }

  for (const file of Array.from(instances)) {
    let parentsInDepth: ExtendedNodeData[] = []
    parentsInDepth.push(tree)

    const foldersBeginning = file.parentPath.split('Content')

    if (!foldersBeginning[1]) {
      alert('Error could not find Content folder!')
      return tree
    }

    const folders = foldersBeginning[1].split(pathDelimiter)
    folders[0] = 'Content'
    let DepthCounter = 1
    for (const folder of folders) {
      const childFolder = newChildFolderNode(createdItemsCounter, folder, `TODO PATH`) // TODO construct the folder paths so that we dont loose filesystem references makes it simpler later
      createdItemsCounter = AddChildAt(
        createdItemsCounter,
        parentsInDepth,
        childFolder,
        DepthCounter
      )
      DepthCounter++
    }
    const childInstanceMatchedSchema = await findSchemaByChildParentFolder(
      schemasDict,
      file,
      pathDelimiter
    )
    const childInstanceData = await filehandling.loadYAMLData(path.join(file.parentPath, file.name))
    const childInstance = newChildFileNode(
      createdItemsCounter,
      file.name,
      file.parentPath,
      childInstanceData,
      childInstanceMatchedSchema.schemaName,
      childInstanceMatchedSchema.fullFolderPath,
      childInstanceMatchedSchema.referenceData
    )
    createdItemsCounter = AddChildAt(
      createdItemsCounter,
      parentsInDepth,
      childInstance,
      DepthCounter
    )
  }

  return tree
}

async function findSchemaByChildParentFolder(
  schemasDict: StringDictKVs | any,
  instanceFileInfo: fs.Dirent,
  pathDelimiter
): Promise<Schema> {
  // from the path find the parent folder and use that as key to get the schema
  const folders = instanceFileInfo.parentPath.split(pathDelimiter)
  const schemaKeys = Object.keys(schemasDict)

  const nameSplitByDot = instanceFileInfo.name.split('.')
  const fileTypeSchemaSuffix = nameSplitByDot[nameSplitByDot.length - 2]

  const schemaKey = schemaKeys.find((key) => {
    const folderKey = folders.find((folder) => {
      const schemaKey = schemaKeys
        .find((key) => {
          return folder.includes(key.split('.')[0])
        })
        ?.split('.')[0]

      return folder.includes(schemaKey || 'not found')
    })
    const removedPlural = folderKey?.slice(0, -1) || 'not found'
    return key.includes(removedPlural) && key.includes(fileTypeSchemaSuffix)
  })

  if (schemaKey) {
    return {
      schemaName: schemaKey,
      fullFolderPath: 'NOT IMPLEMENTED YET',
      referenceData: schemasDict[schemaKey]
    }
  }

  return {
    schemaName: 'Not Found',
    fullFolderPath: 'NOT IMPLEMENTED YET',
    referenceData: schemasDict[0]
  } // fallback
}

function newChildFileNode(
  _theID: number,
  fileName: string,
  path: string,
  instanceData: any,
  schemaName: string,
  schemaPath: string,
  schemaData: any
): ExtendedNodeData {
  return {
    _id: _theID,
    name: fileName,
    checked: 0,
    customDataHolder: {
      isFolder: false,
      fullFolderPath: path,
      instanceData: instanceData,
      jsonSchema: {
        schemaName: schemaName,
        fullFolderPath: schemaPath,
        referenceData: schemaData
      }
    }
  }
}

function newChildFolderNode(_theID: number, folderName: string, path: string): ExtendedNodeData {
  return {
    _id: _theID,
    name: folderName,
    children: [],
    checked: 0,
    isOpen: true,
    customDataHolder: {
      isFolder: true,
      fullFolderPath: path
    }
  }
}
