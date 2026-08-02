import { NodeDescriptor } from '@workspace/typescript-interface/pipeline/nodeDescriptor';
import { waitForPortConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';

export const waitForPortDescriptor: NodeDescriptor = {
    type: 'wait-for-port',
    category: 'flow',
    icon: 'Network',
    description: 'Waits until a TCP port is open inside a container.',
    consumesFromUpstream: ['containerId'],
    configSchema: waitForPortConfigSchema,
    outputs: [{ key: 'containerId' }, { key: 'port' }, { key: 'open' }],
    handles: {
        inputs: [{ id: 'input', position: 'left' }],
        outputs: [{ id: 'output', position: 'right' }],
        attachments: [],
    },
};
