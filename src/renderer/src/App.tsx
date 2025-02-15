import Versions from './components/Versions'
import { ThemeProvider } from '@mui/material/styles'
import Tab from '@mui/material/Tab'
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import Box from '@mui/material/Box'
import CssBaseline from '@mui/material/CssBaseline'
import { withTheme } from '@rjsf/core'
import { Theme } from '@rjsf/mui'
import ObjectFieldTemplate from './ObjectFieldTemplate'
import validator from '@rjsf/validator-ajv8'
import { ExtendedNodeData, updateChildNode } from '../../main/tree'
import { Settings } from '../../main/settings'
import * as React from 'react'
import { defaultTheme } from './ui/theme'
import CustomTree from './components/leftSidebar'
import { useState } from 'react'
import deepEqual from 'deep-equal'

const textRootPathId = 'rootPath'
const Form = withTheme(Theme)

const darkTheme = defaultTheme()

function App(): JSX.Element {
  // SETTINGS for theming etc
  const [settingsState, setSettingsState] = useState<Settings>()
  const customLog = (type) => console.log.bind(console, type)

  // TREE
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

  const onChangeRootPath = () => {
    window['electronAPI'].settingsChangeRootDir().then((val: Settings) => {
      // update PATH in UI
      const filePathElement = document.getElementById(textRootPathId)
      if (filePathElement != null) {
        filePathElement.innerText = val.paths.root
      }
      setSettingsState(val)
    })
  }

  const onRefreshTreeClick = () => {
    window['electronAPI'].treeLoadEventListener().then((val: ExtendedNodeData) => {
      // Update tree
      setTreeState(val as ExtendedNodeData)
    })

    alert('Loaded from filesystem')
  }

  // Main Buttons Below
  const onSaveClick = () => {
    window['electronAPI'].treeSaveEventListener(treeState).then(() => {
      window['electronAPI'].treeLoadEventListener().then((val: ExtendedNodeData) => {
        // reset ui
        setTreeState(val as ExtendedNodeData)
      })
    })

    alert('Saved to filesystem')
  }
  const onFormChange = (formObject: any, _: any) => {
    // set value to correct node!
    // find subtree and push to that value
    const instanceData = formObject.formData
    let changedNode: ExtendedNodeData | null = null
    const copyToCompareChanges = JSON.parse(JSON.stringify(treeState))

    if (instanceData && instanceData.Name && instanceData.Path) {
      const schema = formObject.schema
      const uischema = formObject.uiSchema
      // find in current tree use function to find file
      changedNode = updateChildNode(
        treeState,
        instanceData.Path,
        instanceData.Name,
        instanceData,
        schema,
        uischema
      )
    }

    if (deepEqual(treeState, copyToCompareChanges)) {
      return console.log('No changes!')
    }

    setTreeState(treeState)
    return console.log('Form data changed: ', changedNode)
  }
  const onSubmit = (a: any, b: any) => {
    return console.log('Form data submitted: ', a, b)
  }

  // TAB
  const [selectedTab, setTabSelected] = React.useState('1')
  const tabsSelectionChange = (_: React.SyntheticEvent, newValue: string) => {
    setTabSelected(newValue)
  }

  let treeDataReference = JSON.stringify(treeState.customDataHolder?.instanceData, null, 2)
  // UI
  return (
    <>
      <div className="backgroundImage">
        <CustomTree treeState={treeState} setState={setTreeState}></CustomTree>

        <div className="pathView padding10px">
          Project Path: <strong id="rootPath"></strong>
        </div>

        <div className="consoleView">
          Console
          <br />
          <strong id="consoleLog"></strong>
        </div>

        <div className="middleMainFormsView">
          <TabContext value={selectedTab}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <TabList onChange={tabsSelectionChange} aria-label="lab API tabs example">
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
            <TabPanel value="2">
              <pre id="json">{treeDataReference}</pre>
            </TabPanel>
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
              onClick={onRefreshTreeClick}
              type="button"
              id="btnRefreshSettings"
              className="buttonDefault"
            >
              Load from Disk
            </button>
          </div>
          <div className="padding10px">
            <button
              onClick={onChangeRootPath}
              type="button"
              id="btnChangeRootDirectory"
              className="buttonDefault"
            >
              Change Directory
            </button>
          </div>
        </div>
      </div>

      <Versions></Versions>
    </>
  )
}

export default App
