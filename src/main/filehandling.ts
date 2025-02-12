import { parse } from 'yaml'

import * as fs from 'fs'

const filehandling = {
  getAllDirectoryHandles: (path: string): fs.Dirent[] =>
    fs
      .readdirSync(path, {
        encoding: 'utf-8',
        withFileTypes: true,
        recursive: true
      })
      .filter((x) => x.isDirectory()),
  // SERIALIZED DATA
  getInstancesHandles: (path: string): fs.Dirent[] =>
    fs
      .readdirSync(path, {
        encoding: 'utf-8',
        withFileTypes: true,
        recursive: true
      })
      .filter((x) =>
        ['instance.yaml', 'instance.json'].some((keyword) => x.name.includes(keyword))
      ),
  getSchemaHandles: (path: string): fs.Dirent[] =>
    fs
      .readdirSync(path, {
        encoding: 'utf-8',
        withFileTypes: true
      })
      .filter((x) => ['schema.yaml', 'schema.json'].some((keyword) => x.name.includes(keyword))),
  getUiSchemaHandles: (path: string): fs.Dirent[] =>
    fs
      .readdirSync(path, {
        encoding: 'utf-8',
        withFileTypes: true
      })
      .filter((x) =>
        ['uischema.yaml', 'uischema.json'].some((keyword) => x.name.includes(keyword))
      ),
  getAnimationHandles: (path: string): fs.Dirent[] =>
    fs
      .readdirSync(path, {
        encoding: 'utf-8',
        withFileTypes: true
      })
      .filter((x) =>
        ['animation.yaml', 'animation.json'].some((keyword) => x.name.includes(keyword))
      ),
  // PATH HANDLING
  isDirectory: (path: string): boolean => fs.lstatSync(path).isDirectory(),
  // SAVE
  saveFile(data: any, filePath: string) {
    if (filePath.includes('.json')) {
      this.saveJSONData(data, filePath)
    } else {
      this.saveYAMLData(data, filePath)
    }
  },
  saveJSONData(data: any, filePath: string) {
    const text = JSON.stringify(data)
    fs.writeFileSync(filePath, text)
  },
  saveYAMLData(data: any, filePath: string) {
    const text = JSON.stringify(data)
    fs.writeFileSync(filePath, text)
  },
  // LOAD
  loadFile(filePath: string): any {
    if (filePath.includes('.json')) {
      return this.loadJSONData(filePath)
    } else {
      return this.loadYAMLData(filePath)
    }
  },
  loadJSONData(filePath: string): any {
    const buffer = fs.readFileSync(filePath, 'utf8')
    return JSON.parse(buffer)
  },
  loadYAMLData(filePath: string): any {
    const buffer = fs.readFileSync(filePath, 'utf8')
    return parse(buffer)
  }
}

export default filehandling
