import { Position } from '@xyflow/react';
import { NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';

export const startContainerNodeDef: NodeDefinition = {
    id: 'start-container',
    type: 'base-node',
    category: 'deploy',
    metadata: {
        name: 'pipeline.nodes.start-container.name',
        description: 'pipeline.nodes.start-container.description',
        icon: 'Play',
        color: `${CATEGORY_BG_MUTED['deploy']} ${CATEGORY_TEXT['deploy']}`,
    },
    defaultConfig: {
        containerName: '',
    },
    handles: {
        inputs: [{ id: 'input', position: Position.Left }],
        outputs: [{ id: 'output', position: Position.Right }],
        attachments: [],
    },
};
