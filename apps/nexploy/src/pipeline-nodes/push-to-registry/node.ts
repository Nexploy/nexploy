import { NodeDescriptor } from '@workspace/pipeline-core/nodeDescriptor';
import { pushToRegistryConfigSchema } from '@workspace/pipeline-core/schemas/nodeConfigs.schema';

export const pushToRegistryDescriptor: NodeDescriptor = {
    type: 'push-to-registry',
    category: 'build',
    icon: 'Upload',
    description: 'Pushes a built Docker image to a registry.',
    consumesFromUpstream: ['imageName'],
    configSchema: pushToRegistryConfigSchema,
    outputs: [{ key: 'pushedImages' }, { key: 'registryUrl' }, { key: 'tag', labelKey: 'pipeline.inputs.imageTag' }],
    handles: {
        inputs: [{ id: 'input', position: 'left' }],
        outputs: [{ id: 'output', position: 'right' }],
        attachments: [],
    },
};
