import { NodeDescriptor } from '@workspace/typescript-interface/pipeline/nodeDescriptor';
import { removeContainerConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';

export const removeContainerDescriptor: NodeDescriptor = {
    type: 'remove-container',
    category: 'deploy',
    icon: 'CircleX',
    description: 'Removes a stopped container.',
    consumesFromUpstream: ['containerId'],
    configSchema: removeContainerConfigSchema,
    outputs: [{ key: 'containerId' }],
    handles: {
        inputs: [{ id: 'input', position: 'left' }],
        outputs: [{ id: 'output', position: 'right' }],
        attachments: [],
    },
};
