import { NodeDescriptor } from '@workspace/pipeline-core/nodeDescriptor';
import { restartContainerConfigSchema } from '@workspace/pipeline-core/schemas/nodeConfigs.schema';

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
