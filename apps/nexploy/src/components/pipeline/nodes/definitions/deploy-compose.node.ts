import { NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';

export const deployComposeNodeDef: NodeDefinition = {
    id: 'deploy-compose',
    type: 'attach-node',
    category: 'deploy',
    variant: 'card',
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
        inputs: [{ id: 'input', required: true }],
        outputs: [{ id: 'output' }],
        attachments: [{ id: 'save-version' }],
    },
};
