import { Position } from '@xyflow/react';
import { NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';

export const webhookCloneNodeDef: NodeDefinition = {
    id: 'webhook-clone',
    type: 'base-node',
    category: 'source',
    isStartNode: true,
    metadata: {
        name: 'pipeline.nodes.webhook-clone.name',
        description: 'pipeline.nodes.webhook-clone.description',
        icon: 'Webhook',
        color: `${CATEGORY_BG_MUTED['source']} ${CATEGORY_TEXT['source']}`,
    },
    handles: {
        inputs: [],
        outputs: [{ id: 'output', position: Position.Right }],
        attachments: [],
    },
};
