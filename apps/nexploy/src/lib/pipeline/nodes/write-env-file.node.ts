import { NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import { WriteEnvFileConfig } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';

export const writeEnvFileNodeDef: NodeDefinition<WriteEnvFileConfig> = {
    type: 'write-env-file',
    category: 'utility',
    metadata: {
        name: 'pipeline.nodes.write-env-file.name',
        description: 'pipeline.nodes.write-env-file.description',
        icon: 'FileKey',
        color: 'bg-purple-500/10 text-purple-600',
    },
    defaultConfig: {
        useRepositoryEnvVars: true,
        additionalVars: {},
    },
    handles: {
        inputs: [{ id: 'input', required: true }],
        outputs: [{ id: 'output' }],
    },
    validateConfig: () => true,
};
