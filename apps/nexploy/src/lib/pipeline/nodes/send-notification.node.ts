import { NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import { SendNotificationConfig } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';

export const sendNotificationNodeDef: NodeDefinition<SendNotificationConfig> = {
    type: 'send-notification',
    category: 'notification',
    metadata: {
        name: 'pipeline.nodes.send-notification.name',
        description: 'pipeline.nodes.send-notification.description',
        icon: 'Bell',
        color: 'bg-pink-500/10 text-pink-600',
    },
    defaultConfig: {
        webhookUrl: '',
        triggerOn: ['always'],
    },
    handles: {
        inputs: [{ id: 'input', required: true }],
        outputs: [],
    },
    validateConfig: (config) => typeof config.webhookUrl === 'string' && config.webhookUrl.length > 0,
};
