import { NodeDescriptor } from '@workspace/pipeline-core/nodeDescriptor';
import { tagImageConfigSchema } from '@workspace/pipeline-core/schemas/nodeConfigs.schema';

export const tagImageDescriptor: NodeDescriptor = {
    type: 'tag-image',
    category: 'build',
    icon: 'Tag',
    description: 'Creates a new tag for an existing Docker image.',
    consumesFromUpstream: ['imageId'],
    configSchema: tagImageConfigSchema,
    outputs: [{ key: 'sourceImage' }, { key: 'targetTag' }, { key: 'taggedImage' }],
    handles: {
        inputs: [{ id: 'input', position: 'left' }],
        outputs: [{ id: 'output', position: 'right' }],
        attachments: [],
    },
};
