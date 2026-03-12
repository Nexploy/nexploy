import { NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { Position } from '@xyflow/react';

export const deployComposeNodeDef: NodeDefinition = {
    id: 'deploy-compose',
    type: 'large-node',
    category: 'deploy',
    metadata: {
        name: 'pipeline.nodes.deploy-compose.name',
        description: 'pipeline.nodes.deploy-compose.description',
        icon: 'Layers',
        color: `${CATEGORY_BG_MUTED['deploy']} ${CATEGORY_TEXT['deploy']}`,
    },
    defaultConfig: {
        composePath: 'docker-compose.yml',
    },
    handles: {
        inputs: [{ id: 'input', required: true, position: Position.Left }],
        outputs: [{ id: 'output', position: Position.Right }],
        attachments: [{ id: 'save-version', position: Position.Bottom }],
    },
};
