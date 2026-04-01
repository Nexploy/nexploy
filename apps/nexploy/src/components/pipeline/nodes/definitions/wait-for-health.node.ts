import { Position } from '@xyflow/react';
import { NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';

export const waitForHealthNodeDef: NodeDefinition = {
    id: 'wait-for-health',
    type: 'base-node',
    category: 'utility',
    metadata: {
        name: 'pipeline.nodes.wait-for-health.name',
        description: 'pipeline.nodes.wait-for-health.description',
        icon: 'HeartPulse',
        color: `${CATEGORY_BG_MUTED['utility']} ${CATEGORY_TEXT['utility']}`,
    },
    defaultConfig: {
        containerName: '',
        timeout: 60,
        interval: 5,
    },
    handles: {
        inputs: [{ id: 'input', position: Position.Left }],
        outputs: [{ id: 'output', position: Position.Right }],
        attachments: [],
    },
};
