import { NodeDescriptor } from '@workspace/pipeline-core/nodeDescriptor';

export const saveVersionDescriptor: NodeDescriptor = {
    type: 'save-version',
    nodeType: 'attach-node',
    category: 'utility',
    icon: 'Tag',
    description:
        "Records the current build as a version. ATTACH-NODE: connects to the bottom attachment handle of deploy-compose or create-container using sourceHandle:'save-version' and targetHandle:'input'. Never connect it via the regular right output handle.",
    outputs: [{ key: 'versionNumber' }],
    handles: {
        inputs: [{ id: 'input', position: 'top', acceptsFrom: 'save-version' }],
        outputs: [],
        attachments: [],
    },
};
