import { Position } from '@xyflow/react';
import { NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';

export const setEnvironmentNodeDef: NodeDefinition = {
    id: 'set-environment',
    type: 'base-node',
    category: 'deploy',
    metadata: {
        name: 'pipeline.nodes.set-environment.name',
        description: 'pipeline.nodes.set-environment.description',
        icon: 'Server',
        color: `${CATEGORY_BG_MUTED['deploy']} ${CATEGORY_TEXT['deploy']}`,
    },
    handles: {
        inputs: [{ id: 'input', position: Position.Left }],
        outputs: [{ id: 'output', position: Position.Right }],
        attachments: [],
    },
};
