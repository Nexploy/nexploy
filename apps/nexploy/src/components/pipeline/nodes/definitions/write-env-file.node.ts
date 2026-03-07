import { NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import { WriteEnvFileConfig } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';

export const writeEnvFileNodeDef: NodeDefinition<WriteEnvFileConfig> = {
    type: 'write-env-file',
    category: 'utility',
    metadata: {
        name: 'pipeline.nodes.write-env-file.name',
        description: 'pipeline.nodes.write-env-file.description',
        icon: 'FileKey',
        color: `${CATEGORY_BG_MUTED['utility']} ${CATEGORY_TEXT['utility']}`,
    },
    defaultConfig: {
        useRepositoryEnvVars: true,
        additionalVars: {},
    },
    handles: {
        inputs: [{ id: 'input', required: true }],
        outputs: [{ id: 'output' }],
    },
};
