import { NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import { BuildDockerImageConfig } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { Position } from '@xyflow/react';

export const buildDockerImageNodeDef: NodeDefinition<BuildDockerImageConfig> = {
    id: 'build-docker-image',
    type: 'base-node',
    category: 'build',
    metadata: {
        name: 'pipeline.nodes.build-docker-image.name',
        description: 'pipeline.nodes.build-docker-image.description',
        icon: 'Container',
        color: `${CATEGORY_BG_MUTED['build']} ${CATEGORY_TEXT['build']}`,
    },
    defaultConfig: {
        dockerfilePath: 'Dockerfile',
        buildArgs: {},
    },
    handles: {
        inputs: [{ id: 'input', required: true, position: Position.Left }],
        outputs: [{ id: 'output', position: Position.Right }],
    },
};
