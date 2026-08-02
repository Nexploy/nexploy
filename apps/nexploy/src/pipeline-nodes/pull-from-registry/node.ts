import { NodeDescriptor } from '@workspace/typescript-interface/pipeline/nodeDescriptor';
import { pullFromRegistryConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';

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
