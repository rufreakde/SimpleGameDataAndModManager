import { parse } from 'yaml'

import * as fs from 'fs'

const filehandling = {
  getAllDirectories: (path: string): fs.Dirent[] =>
    fs
      .readdirSync(path, {
        encoding: 'utf-8',
        withFileTypes: true,
        recursive: true
      })
      .filter((x) => x.isDirectory()),
  getAllYamlFileInstances: (path: string): fs.Dirent[] =>
    fs
      .readdirSync(path, {
        encoding: 'utf-8',
        withFileTypes: true,
        recursive: true
      })
      .filter((x) => x.name.includes('.yaml')),
  getJsonSchemaFileHandles: (path: string): fs.Dirent[] =>
    fs
      .readdirSync(path, {
        encoding: 'utf-8',
        withFileTypes: true
      })
      .filter((x) => x.name.includes('schema.json')),
  isDirectory: (path: string): boolean => fs.lstatSync(path).isDirectory(),
  saveJSONData(data, filePath) {
    const text = JSON.stringify(data)
    fs.writeFileSync(filePath, text)
  },
  loadJSONData(filePath) {
    const buffer = fs.readFileSync(filePath, 'utf8')
    return JSON.parse(buffer)
  },
  // function saveYAMLData(data, filePath) {
  //   const text = stringify(data)
  //   fs.writeFileSync(filePath, text);
  // }
  loadYAMLData(filePath) {
    const buffer = fs.readFileSync(filePath, 'utf8')
    return parse(buffer)
  }
}

export default filehandling
