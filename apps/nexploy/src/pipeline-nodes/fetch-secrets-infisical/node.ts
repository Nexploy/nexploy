import { NodeDescriptor } from '@workspace/typescript-interface/pipeline/nodeDescriptor';
import { fetchSecretsInfisicalConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';

export const fetchSecretsInfisicalDescriptor: NodeDescriptor = {
    type: 'fetch-secrets-infisical',
    category: 'config',
    icon: 'KeySquare',
    description:
        'Fetches secrets from Infisical (cloud or self-hosted) for a given project, environment and secret path, and injects them as environment variables for downstream nodes. Authenticates with a machine identity (Universal Auth client Iecret) or a raw access token.',
    configSchema: fetchSecretsInfisicalConfigSchema,
    outputs: [{ key: 'envVariables', type: 'array' }, { key: 'secretCount' }],
    handles: {
        inputs: [{ id: 'input', position: 'left' }],
        outputs: [{ id: 'output', position: 'right' }],
        attachments: [],
    },
};
