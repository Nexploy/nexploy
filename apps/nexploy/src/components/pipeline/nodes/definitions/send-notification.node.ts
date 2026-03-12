import { NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import { SendNotificationConfig } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { Position } from '@xyflow/react';

export const sendNotificationNodeDef: NodeDefinition<SendNotificationConfig> = {
    id: 'send-notification',
    type: 'base-node',
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
        inputs: [{ id: 'input', required: true, position: Position.Left }],
        outputs: [{ id: 'output', position: Position.Right }],
    },
};
