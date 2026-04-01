import { Position } from '@xyflow/react';
import { NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';

export const conditionNodeDef: NodeDefinition = {
    id: 'condition',
    type: 'base-node',
    category: 'utility',
    metadata: {
        name: 'pipeline.nodes.condition.name',
        description: 'pipeline.nodes.condition.description',
        icon: 'GitBranch',
        color: `${CATEGORY_BG_MUTED['utility']} ${CATEGORY_TEXT['utility']}`,
    },
    defaultConfig: {},
    handles: {
        inputs: [{ id: 'input', position: Position.Left }],
        outputs: [
            { id: 'true', position: Position.Right, label: 'true' },
            { id: 'false', position: Position.Right, label: 'false' },
        ],
        attachments: [],
    },
};
