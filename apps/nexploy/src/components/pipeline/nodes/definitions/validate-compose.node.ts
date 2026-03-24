import { Position } from '@xyflow/react';
import { NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';

export const validateComposeNodeDef: NodeDefinition = {
    id: 'validate-compose',
    type: 'base-node',
    category: 'build',
    metadata: {
        name: 'pipeline.nodes.validate-compose.name',
        description: 'pipeline.nodes.validate-compose.description',
        icon: 'FileSearch',
        color: `${CATEGORY_BG_MUTED['build']} ${CATEGORY_TEXT['build']}`,
    },
    handles: {
        inputs: [{ id: 'input', position: Position.Left }],
        outputs: [{ id: 'output', position: Position.Right }],
        attachments: [],
    },
};
