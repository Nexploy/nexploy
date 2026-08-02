import { NodeDescriptor } from '@workspace/typescript-interface/pipeline/nodeDescriptor';
import { startContainerConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';

export const startContainerDescriptor: NodeDescriptor = {
    type: 'start-container',
    category: 'deploy',
    icon: 'Play',
    description: 'Starts an existing container. Typically placed after create-container.',
    consumesFromUpstream: ['containerId'],
    configSchema: startContainerConfigSchema,
    outputs: [{ key: 'containerId' }],
    handles: {
        inputs: [{ id: 'input', position: 'left' }],
        outputs: [{ id: 'output', position: 'right' }],
        attachments: [],
    },
};
