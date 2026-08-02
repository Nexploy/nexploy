import { NodeDescriptor } from '@workspace/pipeline-core/nodeDescriptor';
import { stopContainerConfigSchema } from '@workspace/pipeline-core/schemas/nodeConfigs.schema';

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
