import { NodeDescriptor } from '@workspace/typescript-interface/pipeline/nodeDescriptor';
import { stopContainerConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';

export const stopContainerDescriptor: NodeDescriptor = {
    type: 'stop-container',
    category: 'deploy',
    icon: 'Square',
    description: 'Stops a running container.',
    consumesFromUpstream: ['containerId'],
    configSchema: stopContainerConfigSchema,
    outputs: [{ key: 'containerId' }],
    handles: {
        inputs: [{ id: 'input', position: 'left' }],
        outputs: [{ id: 'output', position: 'right' }],
        attachments: [],
    },
};
