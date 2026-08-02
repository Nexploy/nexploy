import { NodeDescriptor } from '@workspace/pipeline-core/nodeDescriptor';
import { validateDockerfileConfigSchema } from '@workspace/pipeline-core/schemas/nodeConfigs.schema';

export const validateDockerfileDescriptor: NodeDescriptor = {
    type: 'validate-dockerfile',
    category: 'build',
    icon: 'FileCheck',
    description: 'Validates Dockerfile syntax without building. Good for CI lint checks.',
    consumesFromUpstream: ['workDir'],
    configSchema: validateDockerfileConfigSchema,
    outputs: [{ key: 'workDir' }, { key: 'dockerfilePath' }],
    handles: {
        inputs: [{ id: 'input', position: 'left' }],
        outputs: [{ id: 'output', position: 'right' }],
        attachments: [],
    },
};
