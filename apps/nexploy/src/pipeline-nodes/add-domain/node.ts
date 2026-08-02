import { NodeDescriptor } from '@workspace/typescript-interface/pipeline/nodeDescriptor';
import { addDomainConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';

export const addDomainDescriptor: NodeDescriptor = {
    type: 'add-domain',
    category: 'deploy',
    icon: 'Globe',
    description: 'Adds a custom domain and Traefik routing rule for a container.',
    configSchema: addDomainConfigSchema,
    outputs: [{ key: 'host' }, { key: 'containerPort', type: 'number' }, { key: 'domainId' }, { key: 'environmentId' }],
    handles: {
        inputs: [{ id: 'input', position: 'left' }],
        outputs: [{ id: 'output', position: 'right' }],
        attachments: [],
    },
};
