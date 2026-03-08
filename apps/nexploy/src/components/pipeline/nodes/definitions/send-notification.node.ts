import { NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import { SendNotificationConfig } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';

export const sendNotificationNodeDef: NodeDefinition<SendNotificationConfig> = {
    type: 'send-notification',
    category: 'notification',
    metadata: {
        name: 'pipeline.nodes.send-notification.name',
        description: 'pipeline.nodes.send-notification.description',
        icon: 'Bell',
        color: `${CATEGORY_BG_MUTED['notification']} ${CATEGORY_TEXT['notification']}`,
    },
    defaultConfig: {
        webhookUrl: '',
        triggerOn: ['always'],
    },
    handles: {
        inputs: [{ id: 'input', required: true }],
        outputs: [],
    },
};
