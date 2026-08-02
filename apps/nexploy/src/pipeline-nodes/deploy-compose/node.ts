import { NodeDescriptor } from '@workspace/typescript-interface/pipeline/nodeDescriptor';
import { composeFileConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';

export const deployComposeDescriptor: NodeDescriptor = {
    type: 'deploy-compose',
    nodeType: 'large-node',
    category: 'deploy',
    icon: 'Layers',
    description:
        'Deploys a docker-compose stack (runs docker-compose up --build internally — no separate build-docker-image needed). Needs a workDir from an upstream source node. Supports an optional save-version attach-node via its bottom attachment handle.',
    consumesFromUpstream: ['workDir'],
    configSchema: composeFileConfigSchema,
    outputs: [{ key: 'projectName' }, { key: 'containers' }, { key: 'composeConfig' }],
    handles: {
        inputs: [{ id: 'input', position: 'left' }],
        outputs: [{ id: 'output', position: 'right' }],
        attachments: [{ id: 'save-version', position: 'bottom' }],
    },
};
