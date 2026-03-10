import { NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';

export const saveVersionNodeDef: NodeDefinition = {
    type: 'save-version',
    category: 'utility',
    metadata: {
        name: 'pipeline.nodes.save-version.name',
        description: 'pipeline.nodes.save-version.description',
        icon: 'Tag',
        color: `${CATEGORY_BG_MUTED['utility']} ${CATEGORY_TEXT['utility']}`,
    },
    defaultConfig: {},
    handles: {
        inputs: [{ id: 'input' }],
        outputs: [{ id: 'output' }],
    },
};
