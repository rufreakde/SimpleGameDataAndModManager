import Versions from './components/Versions'

import Form, { IChangeEvent } from '@rjsf/core'
import validator from '@rjsf/validator-ajv8'

import FolderTree from 'react-folder-tree'
import { Dictionary, ExtendedNodeData } from '../../main/tree'
import { HiDocument, HiOutlineXMark } from 'react-icons/hi2'
import { useState } from 'react'
import { IconComponents } from 'react-folder-tree'

const textRootPath = 'rootPath'

let settings: Dictionary

function App(): JSX.Element {
  const customIcons: IconComponents = {
    FileIcon: customFileIcon,
    CancelIcon: customCancelIcon
  }

  function customFileIcon({ onClick: defaultOnClick, nodeData }) {
    const { path, name, checked, isOpen, url, ...restData } = nodeData
    const handleClick = () => {
      defaultOnClick()
    }

    return <HiDocument onClick={handleClick} />
  }

  function customCancelIcon({ onClick: defaultOnClick, nodeData }) {
    const { path, name, checked, isOpen, url, ...restData } = nodeData
    const handleClick = () => {
      console.log('icon clicked:', { path, name, url, ...restData })
      defaultOnClick()
    }

    return <HiOutlineXMark onClick={handleClick} />
  }

  let isFormVisible = true
  const [treeState, setTreeState] = useState<ExtendedNodeData>({
    name: 'root',
    children: [],
    customDataHolder: {
      jsonSchema: {
        schemaName: 'currentlyChosenSchema',
        fullFolderPath: 'initial',
        referenceData: {}
      }
    }
  })

  // const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

  const onTreeStateChange = (state: ExtendedNodeData, event: unknown) => {
    // whenever the tree changes not the selection state of children. (e.g. fold out)
    console.log(`${state} + ${event}`)
  }

  const onRefreshClick = () => {
    window['electronAPI'].settings().then((val: Dictionary) => {
      const filePathElement = document.getElementById(textRootPath)
      if (filePathElement != null) {
        filePathElement.innerText = val.paths.root
        settings = val
      }

      setTreeState(settings.tree as ExtendedNodeData)
    })
  }

  const onSaveClick = () => {
    alert('Saved To Filesystem')
  }

  const customLog = (type) => console.log.bind(console, type)

  const onFormChange = (a: any, b: any) => {
    return console.log('Form Data changed: ', a)
  }

  const onSubmit = (a: any, b: any) => {
    return console.log('Form Data submitted: ', a)
  }

  const onNameClick = (opts: { defaultOnClick: () => void; nodeData: ExtendedNodeData }) => {
    const {
      // internal data
      path,
      name,
      checked,
      isOpen,
      children,
      // custom data
      ...data
    } = opts.nodeData

    window['electronAPI'].settings().then((val: Dictionary) => {
      if (val.tree.customDataHolder) {
        val.tree.customDataHolder.jsonSchema.schemaName =
          data.customDataHolder?.jsonSchema.schemaName || ''
        val.tree.customDataHolder.jsonSchema.fullFolderPath =
          data.customDataHolder?.jsonSchema.fullFolderPath || ''
        val.tree.customDataHolder.jsonSchema.referenceData =
          data.customDataHolder?.jsonSchema.referenceData

        console.log(`CLICKED on ${name}:${data.customDataHolder?.jsonSchema.schemaName}`)
      }

      settings = val
      setTreeState(settings.tree as ExtendedNodeData)
    })

    opts.defaultOnClick()
  }

  return (
    <>
      <div className="container">
        <div className="leftSidebar">
          <div id="treeView" className="padding10px">
            <FolderTree
              showCheckbox={false}
              indentPixels={8}
              data={treeState}
              onChange={onTreeStateChange}
              onNameClick={onNameClick}
              iconComponents={customIcons}
            />
          </div>
        </div>

        <div></div>

        <div className="padding10px">
          <div className="readableBackground">
            Project Path: <strong id="rootPath"></strong>
          </div>
          <Form
            key={new Date().getTime()}
            className="readableBackground"
            schema={treeState.customDataHolder?.jsonSchema?.referenceData}
            uiSchema={{}}
            formData={{}}
            validator={validator}
            onChange={onFormChange}
            onSubmit={onSubmit}
            onError={customLog('errors')}
          />
          <div className="horizontalOrderedRight padding10px">
            <div>
              <button onClick={onSaveClick} type="button" id="btnSave">
                Save
              </button>
            </div>
            <div>
              <button onClick={onRefreshClick} type="button" id="btnRefreshSettings">
                Load/Reset
              </button>
            </div>
          </div>
        </div>

        <div></div>
      </div>

      <Versions></Versions>
    </>
  )
}

export default App
