import { customDataHolder, ExtendedNodeData } from '../../../main/tree'
import FolderTree from 'react-folder-tree'
import deepEqual from 'deep-equal'

function CustomTree(props: {
  treeState: ExtendedNodeData
  setTreeState: React.Dispatch<React.SetStateAction<ExtendedNodeData>>
  formState: customDataHolder
  setFormState: React.Dispatch<React.SetStateAction<customDataHolder>>
}): JSX.Element {
  const onTreeStateChange = (state: ExtendedNodeData, event: any) => {
    // whenever the tree changes not the selection state of children. (e.g. fold out)

    if (deepEqual(props.treeState, state)) {
      return
    }

    //props.treeState = state
    console.log(`Update Tree State`)
    props.setTreeState(state)
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

    opts.defaultOnClick()

    window['electronAPI']
      .treeClickedEventListener(props.treeState)
      .then((passedTreeState: ExtendedNodeData) => {
        props.setTreeState(passedTreeState)

        if (
          data.customDataHolder?.instanceData &&
          data.customDataHolder?.jsonSchema.referenceData
        ) {
          props.setFormState(data.customDataHolder)
        }
      })
  }

  return (
    <div className="leftSidebar">
      <div id="treeView" className="padding10px">
        <FolderTree
          showCheckbox={false}
          indentPixels={8}
          data={props.treeState}
          onChange={onTreeStateChange}
          onNameClick={onNameClick}
        />
      </div>
    </div>
  )
}

export default CustomTree
