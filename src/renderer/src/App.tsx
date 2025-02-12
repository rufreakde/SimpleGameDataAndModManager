import Versions from './components/Versions'

import { ThemeProvider, createTheme } from '@mui/material/styles'

import Tab from '@mui/material/Tab'
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import Box from '@mui/material/Box'

import CssBaseline from '@mui/material/CssBaseline'
import { withTheme } from '@rjsf/core'
import { Theme } from '@rjsf/mui'
import ObjectFieldTemplate from './ObjectFieldTemplate'
// check: for custom logic https://github.com/rjsf-team/react-jsonschema-form/pull/2597/files
import validator from '@rjsf/validator-ajv8'

import FolderTree from 'react-folder-tree'
import { Dictionary, ExtendedNodeData } from '../../main/tree'
import { HiDocument, HiOutlineXMark } from 'react-icons/hi2'
import { useState } from 'react'
import { IconComponents } from 'react-folder-tree'

import * as React from 'react'

import fileHandling from '../../../src/main/filehandling'

const textRootPathId = 'rootPath'
const consoleTextId = 'consoleLog'
const Form = withTheme(Theme)

// https://github.com/rjsf-team/react-jsonschema-form/issues/4466
const darkTheme = createTheme({
  palette: {
    mode: 'dark'
  },
  typography: {
    // In Chinese and Japanese the characters are usually larger,
    // so a smaller fontsize may be appropriate.
    fontSize: 12
  },
  components: {
    MuiGrid2: {
      defaultProps: {
        size: {
          xs: 3,
          xl: 3
        }
      }
    }
  }
})

let settings: Dictionary

function writeIntoConsole(text: string) {
  const consoleElement = document.getElementById(consoleTextId)
  if (consoleElement != null) {
    console.log(`Console: ${text}`)
    consoleElement.innerText = text
  }
}

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
      const filePathElement = document.getElementById(textRootPathId)
      if (filePathElement != null) {
        filePathElement.innerText = val.paths.root
        settings = val
      }

      setTreeState(settings.tree as ExtendedNodeData)
      alert('Loaded from filesystem')

      writeIntoConsole('Loaded from filesystem')
    })
  }

  const onSaveClick = () => {
    console.log(`Save to file path: ${treeState.customDataHolder?.instanceData.Path}`)
    // FIXME cant call here to write directly to disk instead we need to send an event
    // with the save data so that it then sends it over
    // fileHandling.saveJSONData(
    //   treeState.customDataHolder?.instanceData,
    //   treeState.customDataHolder?.instanceData.Path
    // )
    alert('Saved to filesystem')
    writeIntoConsole('Loaded from filesystem')
  }

  const customLog = (type) => console.log.bind(console, type)

  const onFormChange = (a: any, b: any) => {
    // TODO
    // this here will be the meat and bones of saving to the data section
    // afterwards it will move over
    // also we need to save delta values which means if someone does not edit something correclty it will persist the error as well
    return console.log('Form data changed: ', a, b)
  }

  const onSubmit = (a: any, b: any) => {
    return console.log('Form data submitted: ', a, b)
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
          data.customDataHolder?.jsonSchema.referenceData || {}

        val.tree.customDataHolder.instanceData = data.customDataHolder?.instanceData || {}

        console.log(`CLICKED on ${name}:${data.customDataHolder?.jsonSchema.schemaName}`)
        console.log(`CLICKED on ${name}:${data.customDataHolder?.instanceData}`)
      }

      settings = val
      setTreeState(settings.tree as ExtendedNodeData)
    })

    opts.defaultOnClick()
  }

  const [value, setValue] = React.useState('1')

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue)
  }

  return (
    <>
      <div className="backgroundImage">
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

        <div className="pathView padding10px">
          Project Path: <strong id="rootPath"></strong>
        </div>

        <div className="consoleView">
          Console
          <br />
          <strong id="consoleLog"></strong>
        </div>

        <div className="middleMainFormsView">
          <TabContext value={value}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <TabList onChange={handleChange} aria-label="lab API tabs example">
                <Tab label="Edit" value="1" />
                <Tab label="Data" value="2" />
                <Tab label="Visuals" value="3" />
              </TabList>
            </Box>
            <TabPanel value="1">
              <ThemeProvider theme={darkTheme}>
                <CssBaseline />
                <Form
                  key={new Date().getTime()}
                  children={true} // hide submit button
                  schema={treeState.customDataHolder?.jsonSchema?.referenceData}
                  // uiSchema={{}}
                  formData={treeState.customDataHolder?.instanceData}
                  validator={validator}
                  onChange={onFormChange}
                  onSubmit={onSubmit}
                  onError={customLog('errors')}
                  templates={{
                    ObjectFieldTemplate: ObjectFieldTemplate
                  }}
                />
              </ThemeProvider>
            </TabPanel>
            <TabPanel value="2">TODO</TabPanel>
            <TabPanel value="3">TODO</TabPanel>
          </TabContext>
        </div>

        <div className="mainButtons horizontalOrderedRight">
          <div className="padding10px">
            <button onClick={onSaveClick} type="button" id="btnSave" className="buttonDefault">
              Save to Disk
            </button>
          </div>
          <div className="padding10px">
            <button
              onClick={onRefreshClick}
              type="button"
              id="btnRefreshSettings"
              className="buttonDefault"
            >
              Load from Disk
            </button>
          </div>
        </div>
      </div>

      <Versions></Versions>
    </>
  )
}

export default App
