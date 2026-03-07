import { NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';

export const validateComposeNodeDef: NodeDefinition = {
    type: 'validate-compose',
    category: 'build',
    metadata: {
        name: 'pipeline.nodes.validate-compose.name',
        description: 'pipeline.nodes.validate-compose.description',
        icon: 'FileSearch',
        color: `${CATEGORY_BG_MUTED['build']} ${CATEGORY_TEXT['build']}`,
    },
    defaultConfig: {
        composePath: 'docker-compose.yml',
    },
    handles: {
        inputs: [{ id: 'input', required: true }],
        outputs: [{ id: 'output' }],
    },
};
