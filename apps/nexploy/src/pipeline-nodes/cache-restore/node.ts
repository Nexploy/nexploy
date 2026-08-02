import { NodeDescriptor } from '@workspace/pipeline-core/nodeDescriptor';
import { cacheRestoreConfigSchema } from '@workspace/pipeline-core/schemas/nodeConfigs.schema';

export const cacheRestoreDescriptor: NodeDescriptor = {
    type: 'cache-restore',
    category: 'files',
    icon: 'FolderInput',
    description: 'Restores a cached directory to speed up builds (e.g. node_modules).',
    configSchema: cacheRestoreConfigSchema,
    outputs: [{ key: 'error', internal: true }],
    handles: {
        inputs: [{ id: 'input', position: 'left' }],
        outputs: [{ id: 'output', position: 'right' }],
        attachments: [],
    },
};
