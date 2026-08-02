import { NodeDescriptor } from '@workspace/typescript-interface/pipeline/nodeDescriptor';
import { createContainerConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';

export const createContainerDescriptor: NodeDescriptor = {
    type: 'create-container',
    nodeType: 'large-node',
    category: 'deploy',
    icon: 'PackagePlus',
    description: 'Creates a Docker container from an image. Chain with start-container to run it.',
    configSchema: createContainerConfigSchema,
    outputs: [{ key: 'containerId' }, { key: 'containerName' }, { key: 'imageName' }],
    handles: {
        inputs: [{ id: 'input', position: 'left' }],
        outputs: [{ id: 'output', position: 'right' }],
        attachments: [{ id: 'save-version', position: 'bottom' }],
    },
};
