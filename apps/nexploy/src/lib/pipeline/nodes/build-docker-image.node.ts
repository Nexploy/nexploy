import { NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import { BuildDockerImageConfig } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';

export const buildDockerImageNodeDef: NodeDefinition<BuildDockerImageConfig> = {
    type: 'build-docker-image',
    category: 'build',
    metadata: {
        name: 'pipeline.nodes.build-docker-image.name',
        description: 'pipeline.nodes.build-docker-image.description',
        icon: 'Container',
        color: 'bg-orange-500/10 text-orange-600',
    },
    defaultConfig: {
        dockerfilePath: 'Dockerfile',
        buildArgs: {},
    },
    handles: {
        inputs: [{ id: 'input', required: true }],
        outputs: [{ id: 'output' }],
    },
    validateConfig: (config) => !!config.dockerfilePath,
};
