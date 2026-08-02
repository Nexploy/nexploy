import { NodeDescriptor } from '@workspace/typescript-interface/pipeline/nodeDescriptor';
import { buildDockerImageConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';

export const buildDockerImageDescriptor: NodeDescriptor = {
    type: 'build-docker-image',
    category: 'build',
    icon: 'Container',
    description:
        'Builds a Docker image from a Dockerfile. Use ONLY for Dockerfile-only deployments — do NOT use before deploy-compose (compose handles its own build internally).',
    consumesFromUpstream: ['workDir'],
    configSchema: buildDockerImageConfigSchema,
    outputs: [{ key: 'imageId' }, { key: 'imageName' }],
    handles: {
        inputs: [{ id: 'input', position: 'left' }],
        outputs: [{ id: 'output', position: 'right' }],
        attachments: [],
    },
};
