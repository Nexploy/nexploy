import { NodeDescriptor } from '@workspace/typescript-interface/pipeline/nodeDescriptor';
import { conditionConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';

export const conditionDescriptor: NodeDescriptor = {
    type: 'condition',
    category: 'flow',
    icon: 'Split',
    description: 'Logical AND/OR gate — all or any upstream nodes must succeed.',
    configSchema: conditionConfigSchema,
    outputs: [{ key: 'passed' }, { key: 'branch' }],
    handles: {
        inputs: [{ id: 'input', position: 'left' }],
        outputs: [
            { id: 'true', position: 'right', labelKey: 'nodes.condition.outputTrue' },
            { id: 'false', position: 'right', labelKey: 'nodes.condition.outputFalse' },
        ],
        attachments: [],
    },
};
