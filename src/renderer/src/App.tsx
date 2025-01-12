import Versions from './components/Versions'

import Form from '@rjsf/core';
import { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

import FolderTree from 'react-folder-tree';
import { Dictionary, ExtendedNodeData } from '../../main/tree'
import { useState } from 'react';

const textRootPath = "rootPath";

let settings: Dictionary;

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

function App(): JSX.Element {
  const [treeState, setTreeState] = useState<ExtendedNodeData>({
    name: 'root',
    children: [
    ],
  });

  const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

  const onTreeStateChange = (state: ExtendedNodeData, event: unknown) => {
    console.log(state, event);
    //setTreeState(state);
  }

  const onRefreshClick = () => {
    window["electronAPI"].settings().then(
      val => {
        const filePathElement = document.getElementById(textRootPath)
        if (filePathElement != null) {
          filePathElement.innerText = val.paths.root;
          settings = val
        }

        setTreeState(settings.tree as ExtendedNodeData)
      }
    )

    alert("Reloaded from Filesystem")
  }

  const onSaveClick = () => {
    alert("Saved To Filesystem")
  }


// export interface NodeData {
//   checked?: Checked;
//   children?: Array<NodeData>;
//   isOpen?: boolean;
//   name: string;
//   [key: string]: any;
// }

  const onNameClick = (opts: {
    defaultOnClick: () => void;
    nodeData: ExtendedNodeData;
  }) => {
    opts.defaultOnClick();

    const {
      // internal data
      path, name, checked, isOpen,
      // custom data
      ...customDataHolder
    } = opts.nodeData;

    console.log(`CLICKED on ${name}:${path}:${checked}:${isOpen}`);
  };

  return (
    <>
      <div className="container">
        <div className='leftSidebar'>
          <div id="treeView" className='padding10px'>
            <FolderTree
              showCheckbox={false}
              indentPixels={8}
              data={treeState}
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
