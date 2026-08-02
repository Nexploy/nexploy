import { NodeDescriptor } from '@workspace/pipeline-core/nodeDescriptor';
import { fetchSecretsDopplerConfigSchema } from '@workspace/pipeline-core/schemas/nodeConfigs.schema';

export const fetchSecretsDopplerDescriptor: NodeDescriptor = {
    type: 'fetch-secrets-doppler',
    category: 'config',
    icon: 'KeyRound',
    description: 'Fetches secrets from Doppler.',
    configSchema: fetchSecretsDopplerConfigSchema,
    outputs: [{ key: 'envVariables', type: 'array' }, { key: 'secretCount' }],
    handles: {
        inputs: [{ id: 'input', position: 'left' }],
        outputs: [{ id: 'output', position: 'right' }],
        attachments: [],
    },
};
