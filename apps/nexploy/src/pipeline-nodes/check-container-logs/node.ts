import { NodeDescriptor } from '@workspace/typescript-interface/pipeline/nodeDescriptor';
import { checkContainerLogsConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';

export const checkContainerLogsDescriptor: NodeDescriptor = {
    type: 'check-container-logs',
    category: 'utility',
    icon: 'ScrollText',
    description: 'Searches container logs for a pattern and optionally fails the pipeline if not found.',
    consumesFromUpstream: ['containerId'],
    configSchema: checkContainerLogsConfigSchema,
    outputs: [{ key: 'found' }, { key: 'matchedLine' }, { key: 'containerId' }],
    handles: {
        inputs: [{ id: 'input', position: 'left' }],
        outputs: [{ id: 'output', position: 'right' }],
        attachments: [],
    },
};
