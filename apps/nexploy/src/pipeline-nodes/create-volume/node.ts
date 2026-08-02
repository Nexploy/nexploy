import { NodeDescriptor } from '@workspace/typescript-interface/pipeline/nodeDescriptor';
import { createVolumeConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';

export const createVolumeDescriptor: NodeDescriptor = {
    type: 'create-volume',
    category: 'utility',
    icon: 'HardDrive',
    description: 'Creates a Docker volume.',
    configSchema: createVolumeConfigSchema,
    outputs: [{ key: 'volumeName' }],
    handles: {
        inputs: [{ id: 'input', position: 'left' }],
        outputs: [{ id: 'output', position: 'right' }],
        attachments: [],
    },
};
