import { NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';

export const cleanWorkdirNodeDef: NodeDefinition = {
    id: 'clean-workdir',
    type: 'base-node',
    category: 'utility',
    metadata: {
        name: 'pipeline.nodes.clean-workdir.name',
        description: 'pipeline.nodes.clean-workdir.description',
        icon: 'Trash2',
        color: `${CATEGORY_BG_MUTED['utility']} ${CATEGORY_TEXT['utility']}`,
    },
    defaultConfig: {},
    handles: {
        inputs: [{ id: 'input' }],
        outputs: [{ id: 'output' }],
    },
};
