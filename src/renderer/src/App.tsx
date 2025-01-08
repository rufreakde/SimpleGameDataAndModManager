import Versions from './components/Versions'

import Form from '@rjsf/core';
import { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

import FolderTree, { NodeData } from 'react-folder-tree';

const btnRefreshId = "btnRefreshSettings";
const textRootPath = "rootPath";

let settings = null

const schema: RJSFSchema = {
  "title": "Files",
  "type": "object",
  "properties": {
    "file": {
      "type": "string",
      "format": "data-url",
      "title": "Single file"
    },
    "files": {
      "type": "array",
      "title": "Multiple files",
      "items": {
        "type": "string",
        "format": "data-url"
      }
    },
    "filesAccept": {
      "type": "string",
      "format": "data-url",
      "title": "Single File with Accept attribute"
    }
  }
};

const GameData: NodeData = {
  name: 'game',
  checked: 0,   // half check: some children are checked
  isOpen: true,   // this folder is opened, we can see it's children
  children: [
    {
      name: 'Units',
      checked: 0,
      isOpen: true,
      children: [
        { name: 'Infantry', checked: 0 },
        { name: 'Tank', checked: 0 },
      ],
    },
    {
      name: 'Buildings',
      checked: 0,
      isOpen: true,
      children: [
        { name: 'Factory', checked: 0 },
        { name: 'City', checked: 0 },
      ],
    },
  ],
};

const ModsData: NodeData = {
  name: 'mods',
  checked: 0,   // half check: some children are checked
  isOpen: true,   // this folder is opened, we can see it's children
  children: [
    {
      name: 'Units',
      checked: 0,
      isOpen: false,
      children: [
      ],
    },
    {
      name: 'Buildings',
      checked: 0,
      isOpen: false,
      children: [
      ],
    },
  ],
};



function App(): JSX.Element {
  const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

  const onTreeStateChange = (state: NodeData, event: unknown) => console.log(state, event);

  const onRefreshClick = () => {
    window["electronAPI"].settings().then(
      val => {
        const filePathElement = document.getElementById(textRootPath)
        if (filePathElement != null) {
          filePathElement.innerText = val.paths.root;
          settings = val
        }
      }
    )
    alert("Reloaded from Filesystem")
  }

  const onSaveClick = () => {
    alert("Saved To Filesystem")
  }

  const onNameClick = (opts: {
    defaultOnClick: () => void;
    nodeData: NodeData;
  }) => {
    opts.defaultOnClick();

    const {
      // internal data
      path, name, isChecked, isOpen,
      // custom data
      url, ...whateverRest
    } = opts.nodeData;

    console.log(`CLICKED on ${name}:${path}:${isChecked}:${isOpen}`);
  };

  return (
    <>
      <div className="container">
        <div className='leftSidebar'>
          <div className='padding10px'>
            <FolderTree
              showCheckbox={false}
              indentPixels={15}
              data={GameData}
              onChange={onTreeStateChange}
              onNameClick={onNameClick}
            />
          </div>
          <div className='padding10px'>
            <FolderTree
              showCheckbox={false}
              indentPixels={15}
              data={ModsData}
              onChange={onTreeStateChange}
              onNameClick={onNameClick}
            />
          </div>
        </div>

        <div></div>

        <div className='padding10px'>
          <div className='readableBackground'>
            Project Path: <strong id="rootPath"></strong>
          </div>
          <Form className='readableBackground' schema={schema} validator={validator} />

          <div className="horizontalOrderedRight padding10px">
            <div>
              <button
                onClick={onSaveClick}
                type="button"
                id="btnSave">Save
              </button>
            </div>
            <div>
              <button
                onClick={onRefreshClick}
                type="button"
                id="btnRefreshSettings">Load/Reset
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
