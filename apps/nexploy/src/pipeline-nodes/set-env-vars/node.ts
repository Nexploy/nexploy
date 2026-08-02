import { NodeDescriptor } from '@workspace/pipeline-core/nodeDescriptor';
import { setEnvVarsConfigSchema } from '@workspace/pipeline-core/schemas/nodeConfigs.schema';

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
