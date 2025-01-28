import Versions from './components/Versions'

import { ThemeProvider, createTheme } from '@mui/material/styles'
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
    },
    MuiGrid: {
      defaultProps: {}
    },
    MuiButton: {
      defaultProps: {
        size: 'small'
      }
    },
    MuiFilledInput: {
      defaultProps: {
        margin: 'dense'
      }
    },
    MuiFormControl: {
      defaultProps: {
        margin: 'dense'
      }
    },
    MuiFormHelperText: {
      defaultProps: {
        margin: 'dense'
      }
    },
    MuiIconButton: {
      defaultProps: {
        size: 'small'
      }
    },
    MuiInputBase: {
      defaultProps: {
        margin: 'dense'
      }
    },
    MuiInputLabel: {
      defaultProps: {
        margin: 'dense'
      }
    },
    MuiListItem: {
      defaultProps: {
        dense: true
      }
    },
    MuiOutlinedInput: {
      defaultProps: {
        margin: 'dense'
      }
    },
    MuiFab: {
      defaultProps: {
        size: 'small'
      }
    },
    MuiTable: {
      defaultProps: {
        size: 'small'
      }
    },
    MuiTextField: {
      defaultProps: {
        margin: 'dense'
      }
    },
    MuiToolbar: {
      defaultProps: {
        variant: 'dense'
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
          <ThemeProvider theme={darkTheme}>
            <CssBaseline />
            <Form
              key={new Date().getTime()}
              children={true} // hide submit button
              schema={treeState.customDataHolder?.jsonSchema?.referenceData}
              // uiSchema={{}}
              // formData={{}}
              validator={validator}
              onChange={onFormChange}
              onSubmit={onSubmit}
              onError={customLog('errors')}
              templates={{
                ObjectFieldTemplate: ObjectFieldTemplate
              }}
            />
          </ThemeProvider>
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
