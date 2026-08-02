import { NodeDescriptor } from '@workspace/pipeline-core/nodeDescriptor';
import { deleteVolumeConfigSchema } from '@workspace/pipeline-core/schemas/nodeConfigs.schema';

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
