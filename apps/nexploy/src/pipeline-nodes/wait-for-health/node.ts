import { NodeDescriptor } from '@workspace/pipeline-core/nodeDescriptor';
import { waitForHealthConfigSchema } from '@workspace/pipeline-core/schemas/nodeConfigs.schema';

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
