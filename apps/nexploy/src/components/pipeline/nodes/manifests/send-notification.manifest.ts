import { sendNotificationConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { sendNotificationNodeDef } from '../definitions/send-notification.node';
import { SendNotificationConfig } from '../config/SendNotificationConfig';
import { type NodeManifest } from '../../types/nodeManifest';

export const sendNotificationManifest: NodeManifest = {
    type: 'send-notification',
    definition: sendNotificationNodeDef,
    configSchema: sendNotificationConfigSchema,
    configPanel: SendNotificationConfig,
};
