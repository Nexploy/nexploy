import { NodeDescriptor } from '@workspace/typescript-interface/pipeline/nodeDescriptor';
import { waitForUrlConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';

export const waitForUrlDescriptor: NodeDescriptor = {
    type: 'wait-for-url',
    category: 'flow',
    icon: 'Globe',
    description: 'Polls a URL until it returns the expected HTTP status code.',
    configSchema: waitForUrlConfigSchema,
    outputs: [
        { key: 'url' },
        { key: 'status', labelKey: 'pipeline.inputs.httpStatus', descriptionKey: 'pipeline.inputs.desc_httpStatus' },
    ],
    handles: {
        inputs: [{ id: 'input', position: 'left' }],
        outputs: [{ id: 'output', position: 'right' }],
        attachments: [],
    },
};
