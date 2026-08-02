import { NodeDescriptor } from '@workspace/pipeline-core/nodeDescriptor';
import { conditionConfigSchema } from '@workspace/pipeline-core/schemas/nodeConfigs.schema';

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
