import { NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';

export const validateDockerfileNodeDef: NodeDefinition = {
    type: 'validate-dockerfile',
    category: 'build',
    metadata: {
        name: 'pipeline.nodes.validate-dockerfile.name',
        description: 'pipeline.nodes.validate-dockerfile.description',
        icon: 'FileCheck',
        color: `${CATEGORY_BG_MUTED['build']} ${CATEGORY_TEXT['build']}`,
    },
    defaultConfig: {
        dockerfilePath: 'Dockerfile',
    },
    handles: {
        inputs: [{ id: 'input', required: true }],
        outputs: [{ id: 'output' }],
    },
};
