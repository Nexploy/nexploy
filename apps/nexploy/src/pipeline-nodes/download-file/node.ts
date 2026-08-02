import { NodeDescriptor } from '@workspace/pipeline-core/nodeDescriptor';
import { downloadFileConfigSchema } from '@workspace/pipeline-core/schemas/nodeConfigs.schema';

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
