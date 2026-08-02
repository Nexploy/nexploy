import { NodeDescriptor } from '@workspace/pipeline-core/nodeDescriptor';
import { pullFromRegistryConfigSchema } from '@workspace/pipeline-core/schemas/nodeConfigs.schema';

export const pullFromRegistryDescriptor: NodeDescriptor = {
    type: 'pull-from-registry',
    category: 'build',
    icon: 'Download',
    description: 'Pulls a Docker image from Docker Hub or a private registry.',
    configSchema: pullFromRegistryConfigSchema,
    outputs: [{ key: 'imageName' }],
    handles: {
        inputs: [{ id: 'input', position: 'left' }],
        outputs: [{ id: 'output', position: 'right' }],
        attachments: [],
    },
};
