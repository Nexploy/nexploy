import { NodeDescriptor } from '@workspace/typescript-interface/pipeline/nodeDescriptor';
import { composeBuildConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';

export const composeBuildDescriptor: NodeDescriptor = {
    type: 'compose-build',
    category: 'build',
    icon: 'Hammer',
    description:
        'Pulls and builds the images of a docker-compose stack WITHOUT starting it. Use it instead of deploy-compose only when a one-off command (compose-run) must run between the build and the start. Needs a workDir from an upstream source node.',
    consumesFromUpstream: ['workDir'],
    configSchema: composeBuildConfigSchema,
    outputs: [
        { key: 'projectName' },
        { key: 'composeFile' },
        { key: 'services' },
        { key: 'builtServices' },
        { key: 'composeConfig' },
    ],
    handles: {
        inputs: [{ id: 'input', position: 'left' }],
        outputs: [{ id: 'output', position: 'right' }],
        attachments: [],
    },
};
