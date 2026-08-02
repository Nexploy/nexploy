import { NodeDescriptor } from '@workspace/typescript-interface/pipeline/nodeDescriptor';
import { deleteNetworkConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';

export const deleteNetworkDescriptor: NodeDescriptor = {
    type: 'delete-network',
    category: 'utility',
    icon: 'Trash2',
    description: 'Deletes a Docker network.',
    configSchema: deleteNetworkConfigSchema,
    outputs: [{ key: 'deletedNetwork' }],
    handles: {
        inputs: [{ id: 'input', position: 'left' }],
        outputs: [{ id: 'output', position: 'right' }],
        attachments: [],
    },
};
