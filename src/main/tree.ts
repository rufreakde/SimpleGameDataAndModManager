import { NodeData } from 'react-folder-tree'
import { RJSFSchema, UiSchema } from '@rjsf/utils'
import * as os from 'os'

import * as fs from 'fs'
import path from 'path'
import pathBrowserfied from 'path-browserify'

import filehandling from './filehandling'

export interface Schema {
  schemaName: string
  fullFolderPath: string
  referenceData: RJSFSchema
  uiSchemaData: UiSchema
}

export interface customDataHolder {
  fullFolderPath?: string
  isFolder?: boolean
  jsonSchema: Schema
  instanceData?: any
}

export interface ExtendedNodeData extends NodeData {
  customDataHolder?: customDataHolder
}

export function initTree(): ExtendedNodeData {
  return emptyFolderNodeData(
    'root',
    {
      title: 'Game Data Editor',
      description: 'Choose a file on the left to edit. Submit to save.',
      type: 'object',
      properties: {}
    },
    {}
  )
}

export const emptyFolderNodeData = (
  nameOfList: string,
  jsonSchemaValue: RJSFSchema,
  uiSchemaValue: UiSchema
): ExtendedNodeData => {
  return {
    _id: 0,
    name: nameOfList,
    children: [],
    customDataHolder: {
      isFolder: true,
      jsonSchema: {
        schemaName: '',
        fullFolderPath: '',
        referenceData: jsonSchemaValue,
        uiSchemaData: uiSchemaValue
      }
    }
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
    const itself = parentsInDepth[depth - 1].children!.at(foundItselfIndex)
    parentsInDepth.push(itself || childToAdd)
    return createdItemsCounter
  } else {
    parentsInDepth.push(childToAdd)
  }

  parentsInDepth[depth - 1].children?.push(childToAdd)
  return createdItemsCounter + 1
}

// backend functionality
// path from nodejs
export async function saveTree(renderThreadTree: ExtendedNodeData) {
  saveSubtree(renderThreadTree) // save to filesystem
}

function saveSubtree(passedNode: ExtendedNodeData) {
  if (passedNode.customDataHolder?.isFolder || passedNode.name === 'root') {
    passedNode.children?.forEach((node: ExtendedNodeData) => {
      saveSubtree(node)
    })
  } else {
    const alwaysDefinedPath = passedNode.customDataHolder!.fullFolderPath!
    const filePath = path.join(alwaysDefinedPath, passedNode.name)
    filehandling.saveFile(passedNode.customDataHolder?.instanceData, filePath)
  }
}

// frontend functionality
// pathBrowserfied
export function updateChildNode(
  renderThreadTree: ExtendedNodeData,
  folderPathAsKey: string,
  fileNameAsKey: string,
  newInstanceData: any,
  newSchema: any,
  newUiSchema: any
) {
  const normalizedPathKey = pathBrowserfied.posix.normalize(
    folderPathAsKey.replaceAll('\\', pathBrowserfied.posix.sep)
  )

  return updateChildNodeSubtree(
    renderThreadTree,
    normalizedPathKey,
    fileNameAsKey,
    newInstanceData,
    newSchema,
    newUiSchema
  )
}

function updateChildNodeSubtree(
  passedNode: ExtendedNodeData,
  folderPathAsKey: string,
  fileNameAsKey: string,
  newInstanceData: any,
  newSchema: any,
  newUiSchema: any
): ExtendedNodeData | null {
  if (
    (passedNode.customDataHolder?.isFolder && passedNode.children) ||
    (passedNode.name === 'root' && passedNode.children)
  ) {
    for (var node of passedNode.children) {
      let found = updateChildNodeSubtree(
        node,
        folderPathAsKey,
        fileNameAsKey,
        newInstanceData,
        newSchema,
        newUiSchema
      )

      if (found) {
        return found
      }
    }
  } else if (!passedNode.customDataHolder || !passedNode.customDataHolder.fullFolderPath) {
    console.error('ERROR something is wrongly maintained in this instance object')
  } else {
    const normalizedNodePath = pathBrowserfied.posix.normalize(
      passedNode.customDataHolder.fullFolderPath.replaceAll('\\', pathBrowserfied.posix.sep)
    )

    if (
      normalizedNodePath.includes(folderPathAsKey) &&
      passedNode.name.includes(fileNameAsKey.toLowerCase())
    ) {
      passedNode.customDataHolder.instanceData = newInstanceData
      passedNode.customDataHolder.jsonSchema = {
        schemaName: passedNode.customDataHolder.jsonSchema.schemaName, // 'TODO FIXME where to get name from',
        fullFolderPath: passedNode.customDataHolder.jsonSchema.fullFolderPath, //'TODO FIXME where to get path from',
        referenceData: newSchema,
        uiSchemaData: newUiSchema
      }
      return passedNode
    }
  }

  return null
}

export async function loadTree(
  passedRootRef: ExtendedNodeData,
  directoryPath: string
): Promise<ExtendedNodeData> {
  const isWindows = os.platform() === 'win32'
  const pathDelimiter = isWindows ? '\\' : '/'
  const schemasDict: any = {}
  const uiSchemasDict: any = {}

  // Get an array of all files and directories in the passed directory using fs.readdirSync
  const schemas = filehandling.getSchemaHandles(directoryPath)
  //const directoryList = filehandling.getAllDirectories(directoryPath  + "/Content");
  const instances = filehandling.getInstancesHandles(directoryPath + '/Content')
  // Create the full path of the file/directory by concatenating the passed directory and file/directory name
  const uiSchemas = filehandling.getUiSchemaHandles(directoryPath)

  let createdItemsCounter = 1

  // load schema
  for (const fileHandle of Array.from(schemas)) {
    const file = await filehandling.loadFile(path.join(fileHandle.parentPath, fileHandle.name))
    schemasDict[fileHandle.name] = file
  }

  // load uiSchemas
  for (const fileHandle of Array.from(uiSchemas)) {
    const file = await filehandling.loadFile(path.join(fileHandle.parentPath, fileHandle.name))
    uiSchemasDict[fileHandle.name] = file
  }

  // match to instances
  for (const file of Array.from(instances)) {
    let parentsInDepth: ExtendedNodeData[] = []
    parentsInDepth.push(passedRootRef)

    const foldersBeginning = file.parentPath.split('Content')

    if (!foldersBeginning[1]) {
      alert('Error could not find Content folder!')
      return passedRootRef
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
      uiSchemasDict,
      file,
      pathDelimiter
    )
    const childInstanceData = await filehandling.loadFile(path.join(file.parentPath, file.name))
    const childInstance = newChildFileNode(
      createdItemsCounter,
      file.name,
      file.parentPath,
      childInstanceData,
      childInstanceMatchedSchema.schemaName,
      childInstanceMatchedSchema.fullFolderPath,
      childInstanceMatchedSchema.referenceData,
      childInstanceMatchedSchema.uiSchemaData
    )
    createdItemsCounter = AddChildAt(
      createdItemsCounter,
      parentsInDepth,
      childInstance,
      DepthCounter
    )
  }

  return passedRootRef
}

async function findSchemaByChildParentFolder(
  schemasDict: RJSFSchema,
  uiSchemasDict: UiSchema,
  instanceFileInfo: fs.Dirent,
  pathDelimiter
): Promise<Schema> {
  // from the path find the parent folder and use that as key to get the schema
  const folders = instanceFileInfo.parentPath.split(pathDelimiter)
  const schemaKeys = Object.keys(schemasDict)
  const uiSchemaKeys = Object.keys(uiSchemasDict)

  const nameSplitByDot = instanceFileInfo.name.split('.')
  const fileTypeSchemaSuffix = nameSplitByDot[nameSplitByDot.length - 2]

  const schemaKey = schemaKeys.find((key) => {
    const folderKey = folders.find((folder) => {
      const folderNameWithoutMetaInformation = folder.split('@')[0]
      const schemaKey = schemaKeys
        .find((key) => {
          const typeFromInstanceFileFirstDotNamePart = key.split('.')[0]
          return folderNameWithoutMetaInformation.includes(typeFromInstanceFileFirstDotNamePart)
        })
        ?.split('.')[0]

      return folderNameWithoutMetaInformation.includes(schemaKey || 'not found')
    })
    const removedPlural = folderKey?.split('@')[0].slice(0, -1) || 'not found'
    return key.includes(removedPlural) && key.includes(fileTypeSchemaSuffix)
  })

  const uiSchemaKey = uiSchemaKeys.find((key) => {
    const folderKey = folders.find((folder) => {
      const folderNameWithoutMetaInformation = folder.split('@')[0]

      const schemaKey = schemaKeys
        .find((key) => {
          const typeFromInstanceFileFirstDotNamePart = key.split('.')[0]
          return folderNameWithoutMetaInformation.includes(typeFromInstanceFileFirstDotNamePart)
        })
        ?.split('.')[0]

      return folderNameWithoutMetaInformation.includes(schemaKey || 'not found')
    })
    const removedPlural = folderKey?.split('@')[0].slice(0, -1) || 'not found'
    return key.includes(removedPlural) && key.includes(fileTypeSchemaSuffix)
  })

  if (schemaKey && uiSchemaKey) {
    return {
      schemaName: schemaKey,
      fullFolderPath: 'NOT IMPLEMENTED YET',
      referenceData: schemasDict[schemaKey],
      uiSchemaData: uiSchemasDict[uiSchemaKey]
    }
  }

  return {
    schemaName: 'Not Found',
    fullFolderPath: 'NOT IMPLEMENTED YET',
    referenceData: schemasDict[0],
    uiSchemaData: uiSchemasDict[0]
  } // fallback
}

function newChildFileNode(
  _theID: number,
  fileName: string,
  path: string,
  instanceData: any,
  schemaName: string,
  schemaPath: string,
  schemaData: RJSFSchema,
  uiSchemaData: UiSchema
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
        referenceData: schemaData,
        uiSchemaData: uiSchemaData
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
      fullFolderPath: path,
      jsonSchema: {
        schemaName: '',
        fullFolderPath: '',
        referenceData: {},
        uiSchemaData: {}
      }
    }
  }
}
