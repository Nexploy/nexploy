import { NodeDescriptor } from '@workspace/typescript-interface/pipeline/nodeDescriptor';
import { deleteVolumeConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';

export const deleteVolumeDescriptor: NodeDescriptor = {
    type: 'delete-volume',
    category: 'utility',
    icon: 'Trash2',
    description: 'Deletes a Docker volume.',
    configSchema: deleteVolumeConfigSchema,
    outputs: [{ key: 'deletedVolume' }],
    handles: {
        inputs: [{ id: 'input', position: 'left' }],
        outputs: [{ id: 'output', position: 'right' }],
        attachments: [],
    },
};
