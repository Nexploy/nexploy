import { NodeDescriptor } from '@workspace/pipeline-core/nodeDescriptor';
import { createServiceConfigSchema } from '@workspace/pipeline-core/schemas/nodeConfigs.schema';

export const createServiceDescriptor: NodeDescriptor = {
    type: 'create-service',
    nodeType: 'large-node',
    category: 'deploy',
    icon: 'Layers',
    description: 'Creates a Docker Swarm service. Requires Swarm mode enabled.',
    configSchema: createServiceConfigSchema,
    outputs: [{ key: 'serviceId' }, { key: 'serviceName' }, { key: 'imageName' }],
    handles: {
        inputs: [{ id: 'input', position: 'left' }],
        outputs: [{ id: 'output', position: 'right' }],
        attachments: [],
    },
};
