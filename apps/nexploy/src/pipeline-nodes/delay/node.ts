import { NodeDescriptor } from '@workspace/pipeline-core/nodeDescriptor';
import { delayConfigSchema } from '@workspace/pipeline-core/schemas/nodeConfigs.schema';

export const delayDescriptor: NodeDescriptor = {
    type: 'delay',
    category: 'flow',
    icon: 'Timer',
    description: 'Adds a fixed delay (in seconds) between pipeline steps.',
    configSchema: delayConfigSchema,
    outputs: [{ key: 'delayed' }],
    handles: {
        inputs: [{ id: 'input', position: 'left' }],
        outputs: [{ id: 'output', position: 'right' }],
        attachments: [],
    },
};
