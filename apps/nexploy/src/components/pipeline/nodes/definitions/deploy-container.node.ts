import { NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import { DeployContainerConfig } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { Position } from '@xyflow/react';

export const deployContainerNodeDef: NodeDefinition<DeployContainerConfig> = {
    id: 'deploy-container',
    type: 'large-node',
    category: 'deploy',
    metadata: {
        name: 'pipeline.nodes.deploy-container.name',
        description: 'pipeline.nodes.deploy-container.description',
        icon: 'Rocket',
        color: `${CATEGORY_BG_MUTED['deploy']} ${CATEGORY_TEXT['deploy']}`,
    },
    defaultConfig: {
        ports: [],
    },
    handles: {
        inputs: [{ id: 'input', required: true, position: Position.Left }],
        outputs: [{ id: 'output', position: Position.Right }],
        attachments: [{ id: 'save-version', position: Position.Bottom }],
    },
};
