import { NodeDescriptor } from '@workspace/typescript-interface/pipeline/nodeDescriptor';
import { createReleaseConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';

export const createReleaseDescriptor: NodeDescriptor = {
    type: 'create-release',
    category: 'integration',
    icon: 'PackageCheck',
    description: 'Creates a release on GitHub or GitLab.',
    configSchema: createReleaseConfigSchema,
    outputs: [{ key: 'releaseId' }, { key: 'releaseUrl' }, { key: 'tagName' }],
    handles: {
        inputs: [{ id: 'input', position: 'left' }],
        outputs: [{ id: 'output', position: 'right' }],
        attachments: [],
    },
};
