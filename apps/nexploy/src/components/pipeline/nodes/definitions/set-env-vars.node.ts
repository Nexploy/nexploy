import { NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';

export const setEnvVarsNodeDef: NodeDefinition = {
    id: 'set-env-vars',
    type: 'base-node',
    category: 'utility',
    metadata: {
        name: 'pipeline.nodes.set-env-vars.name',
        description: 'pipeline.nodes.set-env-vars.description',
        icon: 'Variable',
        color: `${CATEGORY_BG_MUTED['utility']} ${CATEGORY_TEXT['utility']}`,
    },
    defaultConfig: {
        vars: {},
    },
    handles: {
        inputs: [],
        outputs: [{ id: 'output' }],
    },
};
