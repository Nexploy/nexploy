import { NodeDescriptor } from '@workspace/typescript-interface/pipeline/nodeDescriptor';
import { composeFileConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';

export const validateComposeDescriptor: NodeDescriptor = {
    type: 'validate-compose',
    category: 'build',
    icon: 'FileSearch',
    description: 'Validates a docker-compose file syntax.',
    consumesFromUpstream: ['workDir'],
    configSchema: composeFileConfigSchema,
    outputs: [{ key: 'workDir' }, { key: 'composePath' }],
    handles: {
        inputs: [{ id: 'input', position: 'left' }],
        outputs: [{ id: 'output', position: 'right' }],
        attachments: [],
    },
};
