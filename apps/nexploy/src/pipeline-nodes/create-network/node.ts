import { NodeDescriptor } from '@workspace/typescript-interface/pipeline/nodeDescriptor';
import { createNetworkConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';

export const createNetworkDescriptor: NodeDescriptor = {
    type: 'create-network',
    category: 'utility',
    icon: 'Network',
    description: 'Creates a Docker network.',
    configSchema: createNetworkConfigSchema,
    outputs: [{ key: 'networkId' }, { key: 'networkName' }],
    handles: {
        inputs: [{ id: 'input', position: 'left' }],
        outputs: [{ id: 'output', position: 'right' }],
        attachments: [],
    },
};
