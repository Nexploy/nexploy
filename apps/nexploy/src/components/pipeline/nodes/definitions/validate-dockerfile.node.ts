import { NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { Position } from '@xyflow/react';

export const validateDockerfileNodeDef: NodeDefinition = {
    id: 'validate-dockerfile',
    type: 'base-node',
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
        inputs: [{ id: 'input', required: true, position: Position.Left }],
        outputs: [{ id: 'output', position: Position.Right }],
    },
};
