import { NodeDescriptor } from '@workspace/typescript-interface/pipeline/nodeDescriptor';
import { cacheSaveConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';

export const cacheSaveDescriptor: NodeDescriptor = {
    type: 'cache-save',
    category: 'files',
    icon: 'FolderOutput',
    description: 'Saves a directory to cache for future builds.',
    configSchema: cacheSaveConfigSchema,
    outputs: [{ key: 'error', internal: true }],
    handles: {
        inputs: [{ id: 'input', position: 'left' }],
        outputs: [{ id: 'output', position: 'right' }],
        attachments: [],
    },
};
