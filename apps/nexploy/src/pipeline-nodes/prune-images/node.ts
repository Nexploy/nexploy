import { NodeDescriptor } from '@workspace/typescript-interface/pipeline/nodeDescriptor';
import { pruneImagesConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';

export const pruneImagesDescriptor: NodeDescriptor = {
    type: 'prune-images',
    category: 'build',
    icon: 'Trash2',
    description: 'Prunes unused Docker images to free disk space.',
    configSchema: pruneImagesConfigSchema,
    outputs: [{ key: 'removedImages' }, { key: 'reclaimedSpace' }],
    handles: {
        inputs: [{ id: 'input', position: 'left' }],
        outputs: [{ id: 'output', position: 'right' }],
        attachments: [],
    },
};
