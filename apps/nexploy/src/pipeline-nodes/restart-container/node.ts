import { NodeDescriptor } from '@workspace/typescript-interface/pipeline/nodeDescriptor';
import { restartContainerConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';

export const restartContainerDescriptor: NodeDescriptor = {
    type: 'restart-container',
    category: 'deploy',
    icon: 'RotateCcw',
    description: 'Restarts a container.',
    consumesFromUpstream: ['containerId'],
    configSchema: restartContainerConfigSchema,
    outputs: [{ key: 'containerId' }],
    handles: {
        inputs: [{ id: 'input', position: 'left' }],
        outputs: [{ id: 'output', position: 'right' }],
        attachments: [],
    },
};
