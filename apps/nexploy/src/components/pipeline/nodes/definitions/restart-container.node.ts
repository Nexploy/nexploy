import { Position } from '@xyflow/react';
import { NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';

export const restartContainerNodeDef: NodeDefinition = {
    id: 'restart-container',
    type: 'base-node',
    category: 'deploy',
    metadata: {
        name: 'pipeline.nodes.restart-container.name',
        description: 'pipeline.nodes.restart-container.description',
        icon: 'RotateCcw',
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
