import { NodeDescriptor } from '@workspace/pipeline-core/nodeDescriptor';
import { composeFileConfigSchema } from '@workspace/pipeline-core/schemas/nodeConfigs.schema';

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
