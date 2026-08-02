import { NodeDescriptor } from '@workspace/pipeline-core/nodeDescriptor';
import { composeUpConfigSchema } from '@workspace/pipeline-core/schemas/nodeConfigs.schema';

export const composeUpDescriptor: NodeDescriptor = {
    type: 'compose-up',
    nodeType: 'large-node',
    category: 'deploy',
    icon: 'Rocket',
    description:
        'Starts the compose stack built by compose-build (docker compose up -d). Must be placed after a compose-build node. Supports an optional save-version attach-node via its bottom attachment handle.',
    consumesFromUpstream: ['workDir', 'composeFile', 'projectName'],
    configSchema: composeUpConfigSchema,
    outputs: [{ key: 'projectName' }, { key: 'containers' }, { key: 'composeConfig' }],
    handles: {
        inputs: [{ id: 'input', position: 'left' }],
        outputs: [{ id: 'output', position: 'right' }],
        attachments: [{ id: 'save-version', position: 'bottom' }],
    },
};
