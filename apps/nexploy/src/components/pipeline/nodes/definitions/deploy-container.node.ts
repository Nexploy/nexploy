import { NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import { DeployContainerConfig } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';

export const deployContainerNodeDef: NodeDefinition<DeployContainerConfig> = {
    id: 'deploy-container',
    type: 'attach-node',
    category: 'deploy',
    variant: 'card',
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
        inputs: [{ id: 'input', required: true }],
        outputs: [{ id: 'output' }],
        attachments: [{ id: 'save-version' }],
    },
};
