import { Position } from '@xyflow/react';
import { NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';

export const removeContainerNodeDef: NodeDefinition = {
    id: 'remove-container',
    type: 'base-node',
    category: 'deploy',
    metadata: {
        name: 'pipeline.nodes.remove-container.name',
        description: 'pipeline.nodes.remove-container.description',
        icon: 'CircleX',
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
