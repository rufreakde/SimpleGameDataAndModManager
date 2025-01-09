import { NodeData } from 'react-folder-tree';
import * as os from "os";

import * as fs from 'fs';
import path from 'path';

import filehandling from './filehandling';



export type Dictionary = {
  [key: string]: NodeData | StringDictKVs | null;
};

export interface Schema {
  name: string;
  path: string;
  referenceData: any;
}

export interface ExtendedNodeData extends NodeData {
  path?: string;
  isFolder?: boolean;
  jsonSchema?: Schema;
  instanceData?: any;
}

export type StringDictKVs = {
  [key: string]: string
}

export const emptyFolderNodeData = (nameOfList: string) : ExtendedNodeData => {
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
  
  export async function getTree(directoryPath: string): Promise<ExtendedNodeData> {
  
    const isWindows = os.platform() === "win32";
    const pathDelimiter = isWindows ? "\\" : "/";
    const schemasDict: StringDictKVs | any= {};
  
    const tree: ExtendedNodeData = emptyFolderNodeData("root");
    tree.path = directoryPath;
    // Get an array of all files and directories in the passed directory using fs.readdirSync
    const schemas = filehandling.getJsonSchemaFileHandles(directoryPath);
    //const directoryList = filehandling.getAllDirectories(directoryPath  + "/Content");
    const instances = filehandling.getAllYamlFileInstances(directoryPath + "/Content")
    // Create the full path of the file/directory by concatenating the passed directory and file/directory name
  
    // match each instance to a schema
    for (const fileHandle of Array.from(schemas)) {
      const file = await filehandling.loadJSONData( path.join(fileHandle.parentPath ,fileHandle.name))
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
      const childInstanceData = await filehandling.loadYAMLData( path.join(file.parentPath, file.name))
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
  



