import { NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { Position } from '@xyflow/react';

export const saveVersionNodeDef: NodeDefinition = {
    id: 'save-version',
    type: 'attach-node',
    category: 'utility',
    metadata: {
        name: 'pipeline.nodes.save-version.name',
        description: 'pipeline.nodes.save-version.description',
        icon: 'Tag',
        color: `${CATEGORY_BG_MUTED['utility']} ${CATEGORY_TEXT['utility']}`,
    },
    defaultConfig: {},
    handles: {
        inputs: [{ id: 'input', position: Position.Top }],
        outputs: [],
    },
};
