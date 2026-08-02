import { NodeDescriptor } from '@workspace/pipeline-core/nodeDescriptor';
import { deleteImageConfigSchema } from '@workspace/pipeline-core/schemas/nodeConfigs.schema';

export const deleteImageDescriptor: NodeDescriptor = {
    type: 'delete-image',
    category: 'build',
    icon: 'Trash2',
    description: 'Deletes a specific Docker image.',
    consumesFromUpstream: ['imageId'],
    configSchema: deleteImageConfigSchema,
    outputs: [
        { key: 'deletedImageId', labelKey: 'pipeline.inputs.imageId', descriptionKey: 'pipeline.inputs.desc_imageId' },
    ],
    handles: {
        inputs: [{ id: 'input', position: 'left' }],
        outputs: [{ id: 'output', position: 'right' }],
        attachments: [],
    },
};
