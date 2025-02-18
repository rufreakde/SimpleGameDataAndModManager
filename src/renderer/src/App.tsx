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
import { customDataHolder, ExtendedNodeData, updateChildNode } from '../../main/tree'
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
  // STATES
  // SETTINGS
  const [settingsState, setSettingsState] = useState<Settings>()

  // TREE
  const [treeState, setTreeState] = useState<ExtendedNodeData>({
    name: 'root',
    children: [],
    customDataHolder: {
      uiSchema: {},
      jsonSchema: {
        schemaName: 'currentlyChosenSchema',
        fullFolderPath: 'initial',
        referenceData: {}
      }
    }
  })

  // FORM
  const [formState, setFormState] = useState<customDataHolder>({
    fullFolderPath: 'Not Set Yet',
    isFolder: false,
    jsonSchema: {
      schemaName: 'currentlyChosenSchema',
      fullFolderPath: 'initial',
      referenceData: {}
    },
    uiSchema: {
      'ui:submitButtonOptions': { norender: true }
    },
    instanceData: {
      Description: 'Load folder tree to display necessary information'
    }
  })

  const customLog = (type) => console.log.bind(console, type)

  const onChangeRootPath = () => {
    window['electronAPI'].settingsChangeRootDir().then((tree: Settings) => {
      // update PATH in UI
      const filePathElement = document.getElementById(textRootPathId)
      if (filePathElement != null) {
        filePathElement.innerText = tree.paths.root
      }
      setSettingsState(tree)
    })
  }

  const onRefreshTreeClick = () => {
    window['electronAPI'].treeLoadEventListener().then((tree: ExtendedNodeData) => {
      // Update tree
      setTreeState(tree)
    })

    alert('Loaded from filesystem')
  }

  // Main Buttons Below
  const onSaveClick = () => {
    window['electronAPI'].treeSaveEventListener(treeState).then((tree: ExtendedNodeData) => {
      // FIXME as soon as I update the state here after save it crashes but why????
      setTreeState(tree)

      if (temporaryNotSubmittetChangedWorkaround) {
        setFormState(temporaryNotSubmittetChangedWorkaround)
      }
    })

    alert('Saved to filesystem')
  }

  // dont try trz to uptimize nor fix this workaround the state handling of the FORM is just stupid
  // with this in memory holder we store it until UI re renders on changes
  // and later on on a UI re render we just do a set state :) e.g. Save button!
  let temporaryNotSubmittetChangedWorkaround: customDataHolder | null = null

  const onFormChange = (formObject: any, _: any) => {
    // set value to correct node!
    // find subtree and push to that value
    const newInstanceData = formObject.formData
    const newSchema = formObject.schema
    const newUiSchema = formObject.uiSchema

    if (!newInstanceData?.Name || !newInstanceData?.Path) {
      return console.log('Error instance not found!')
    }

    if (deepEqual(formState?.instanceData, newInstanceData)) {
      return console.log('No changes!')
    }

    // find in current tree use function to find file
    const changedNode = updateChildNode(
      treeState,
      newInstanceData.Path,
      newInstanceData.Name,
      newInstanceData,
      newSchema,
      newUiSchema
    )

    setTreeState(treeState)

    // this section here is just because setFormState fucks up input of FORM dnk why fuck it...
    const updatedFormData: customDataHolder = {
      fullFolderPath: formState.fullFolderPath,
      isFolder: formState.isFolder,
      uiSchema: newUiSchema,
      jsonSchema: {
        fullFolderPath: formState.jsonSchema.fullFolderPath, // where to get that one from?
        referenceData: newSchema,
        schemaName: formState.jsonSchema.schemaName // where to get that one from?
      },
      instanceData: newInstanceData
    }

    temporaryNotSubmittetChangedWorkaround = updatedFormData

    return console.log('Form data updated: ', changedNode)
  }

  // TAB
  const [selectedTab, setTabSelected] = React.useState('1')
  const tabsSelectionChange = (_: React.SyntheticEvent, newValue: string) => {
    setTabSelected(newValue)
  }

  let formDataInstanceReference = JSON.stringify(formState.instanceData, null, 2)

  let treeStateReference = JSON.stringify(treeState, null, 2)
  // UI
  return (
    <>
      <div className="backgroundImage">
        <CustomTree
          treeState={treeState}
          setTreeState={setTreeState}
          formState={formState}
          setFormState={setFormState}
        ></CustomTree>

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
                <Tab label="FileTree" value="4" />
              </TabList>
            </Box>
            <TabPanel value="1">
              <ThemeProvider theme={darkTheme}>
                <CssBaseline />
                <Form
                  key={new Date().getTime()}
                  children={true}
                  schema={formState.jsonSchema?.referenceData}
                  uiSchema={formState.uiSchema}
                  formData={formState['instanceData']}
                  validator={validator}
                  onChange={onFormChange}
                  onError={customLog('errors')}
                  templates={{
                    ObjectFieldTemplate: ObjectFieldTemplate
                  }}
                />
              </ThemeProvider>
            </TabPanel>
            <TabPanel value="2">
              <pre id="json">{formDataInstanceReference}</pre>
            </TabPanel>
            <TabPanel value="3">TODO</TabPanel>
            <TabPanel value="4">
              <pre id="json">{treeStateReference}</pre>
            </TabPanel>
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
