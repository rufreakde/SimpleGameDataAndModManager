import { ExtendedNodeData } from '../../../main/tree'
import FolderTree from 'react-folder-tree'

function CustomTree(props: {
  treeState: ExtendedNodeData
  setState: React.Dispatch<React.SetStateAction<ExtendedNodeData>>
}): JSX.Element {
  const onTreeStateChange = (state: ExtendedNodeData, event: unknown) => {
    // whenever the tree changes not the selection state of children. (e.g. fold out)
    console.log(`${state} + ${event}`)
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

    window['electronAPI'].treeClickedEventListener().then((val: ExtendedNodeData) => {
      if (val.customDataHolder) {
        val.customDataHolder.jsonSchema.schemaName =
          data.customDataHolder?.jsonSchema.schemaName || ''

        val.customDataHolder.jsonSchema.fullFolderPath =
          data.customDataHolder?.jsonSchema.fullFolderPath || ''

        val.customDataHolder.jsonSchema.referenceData =
          data.customDataHolder?.jsonSchema.referenceData || {}

        val.customDataHolder.instanceData = data.customDataHolder?.instanceData || {}

        console.log(`CLICKED on ${name}:${data.customDataHolder?.jsonSchema.schemaName}`)
        console.log(`CLICKED on ${name}:${data.customDataHolder?.instanceData}`)
      }

      props.setState(val as ExtendedNodeData)
    })

    opts.defaultOnClick()
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
