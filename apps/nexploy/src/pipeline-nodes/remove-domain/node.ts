import { NodeDescriptor } from '@workspace/typescript-interface/pipeline/nodeDescriptor';
import { removeDomainConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';

export const removeDomainDescriptor: NodeDescriptor = {
    type: 'remove-domain',
    category: 'deploy',
    icon: 'GlobeOff',
    description: 'Removes a domain and its Traefik routing rule for the repository.',
    configSchema: removeDomainConfigSchema,
    outputs: [
        { key: 'host' },
        {
            key: 'removed',
            labelKey: 'pipeline.inputs.domainRemoved',
            descriptionKey: 'pipeline.inputs.desc_domainRemoved',
        },
    ],
    handles: {
        inputs: [{ id: 'input', position: 'left' }],
        outputs: [{ id: 'output', position: 'right' }],
        attachments: [],
    },
};
