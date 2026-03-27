import { Position } from '@xyflow/react';
import { NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';

export const createNetworkNodeDef: NodeDefinition = {
    id: 'create-network',
    type: 'base-node',
    category: 'utility',
    metadata: {
        name: 'pipeline.nodes.create-network.name',
        description: 'pipeline.nodes.create-network.description',
        icon: 'Network',
        color: `${CATEGORY_BG_MUTED['utility']} ${CATEGORY_TEXT['utility']}`,
    },
    defaultConfig: {
        name: '',
        driver: 'bridge',
    },
    handles: {
        inputs: [{ id: 'input', position: Position.Left }],
        outputs: [{ id: 'output', position: Position.Right }],
        attachments: [],
    },
};
