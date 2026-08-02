import { NodeDescriptor } from '@workspace/typescript-interface/pipeline/nodeDescriptor';
import { waitForHealthConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';

export const waitForHealthDescriptor: NodeDescriptor = {
    type: 'wait-for-health',
    category: 'flow',
    icon: 'HeartPulse',
    description: "Waits until a container's health check reports healthy.",
    consumesFromUpstream: ['containerId'],
    configSchema: waitForHealthConfigSchema,
    outputs: [{ key: 'containerId' }, { key: 'healthy' }],
    handles: {
        inputs: [{ id: 'input', position: 'left' }],
        outputs: [{ id: 'output', position: 'right' }],
        attachments: [],
    },
};
