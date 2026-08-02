import { NodeDescriptor } from '@workspace/typescript-interface/pipeline/nodeDescriptor';
import { gitTagConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';

export const gitTagDescriptor: NodeDescriptor = {
    type: 'git-tag',
    category: 'source',
    icon: 'Milestone',
    description: 'Creates a git tag on the current commit.',
    configSchema: gitTagConfigSchema,
    outputs: [{ key: 'tagName' }, { key: 'remote' }],
    handles: {
        inputs: [{ id: 'input', position: 'left' }],
        outputs: [{ id: 'output', position: 'right' }],
        attachments: [],
    },
};
