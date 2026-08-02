import { NodeDescriptor } from '@workspace/typescript-interface/pipeline/nodeDescriptor';
import { downloadFileConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';

export const downloadFileDescriptor: NodeDescriptor = {
    type: 'download-file',
    category: 'files',
    icon: 'Download',
    description: 'Downloads a file from a URL into the working directory.',
    configSchema: downloadFileConfigSchema,
    outputs: [{ key: 'url' }, { key: 'outputFile' }, { key: 'filename' }, { key: 'sizeBytes' }],
    handles: {
        inputs: [{ id: 'input', position: 'left' }],
        outputs: [{ id: 'output', position: 'right' }],
        attachments: [],
    },
};
