import { sendNotificationConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { SendNotificationConfig } from '../config/SendNotificationConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { Position } from '@xyflow/react';
import { Bell } from 'lucide-react';

export const sendNotificationManifest: NodeManifest = {
    type: 'send-notification',
    definition: {
        id: 'send-notification',
        type: 'base-node',
        category: 'notification',
        metadata: {
            name: 'pipeline.nodes.send-notification.name',
            description: 'pipeline.nodes.send-notification.description',
            icon: Bell,
            color: `${CATEGORY_BG_MUTED['notification']} ${CATEGORY_TEXT['notification']}`,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: sendNotificationConfigSchema,
    configPanel: SendNotificationConfig,
};
