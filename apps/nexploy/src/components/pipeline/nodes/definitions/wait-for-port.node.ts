import { Position } from '@xyflow/react';
import { NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';

export const waitForPortNodeDef: NodeDefinition = {
    id: 'wait-for-port',
    type: 'base-node',
    category: 'utility',
    metadata: {
        name: 'pipeline.nodes.wait-for-port.name',
        description: 'pipeline.nodes.wait-for-port.description',
        icon: 'Network',
        color: `${CATEGORY_BG_MUTED['utility']} ${CATEGORY_TEXT['utility']}`,
    },
    defaultConfig: {
        host: '',
        port: 80,
        timeout: 60,
        interval: 3,
    },
    handles: {
        inputs: [{ id: 'input', position: Position.Left }],
        outputs: [{ id: 'output', position: Position.Right }],
        attachments: [],
    },
};
