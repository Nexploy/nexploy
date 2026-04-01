import { Position } from '@xyflow/react';
import { NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';

export const httpRequestNodeDef: NodeDefinition = {
    id: 'http-request',
    type: 'base-node',
    category: 'utility',
    metadata: {
        name: 'pipeline.nodes.http-request.name',
        description: 'pipeline.nodes.http-request.description',
        icon: 'Webhook',
        color: `${CATEGORY_BG_MUTED['utility']} ${CATEGORY_TEXT['utility']}`,
    },
    defaultConfig: {
        url: '',
        method: 'POST',
        headers: [],
        body: '',
        expectedStatus: 200,
        continueOnError: false,
    },
    handles: {
        inputs: [{ id: 'input', position: Position.Left }],
        outputs: [{ id: 'output', position: Position.Right }],
        attachments: [],
    },
};
