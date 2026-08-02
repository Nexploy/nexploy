import { NodeDescriptor } from '@workspace/typescript-interface/pipeline/nodeDescriptor';
import { setEnvVarsConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';

export const setEnvVarsDescriptor: NodeDescriptor = {
    type: 'set-env-vars',
    category: 'config',
    icon: 'Variable',
    description: 'Defines inline environment variables for downstream nodes.',
    configSchema: setEnvVarsConfigSchema,
    outputs: [{ key: 'envVariables', type: 'array' }],
    handles: {
        inputs: [{ id: 'input', position: 'left' }],
        outputs: [{ id: 'output', position: 'right' }],
        attachments: [],
    },
};
