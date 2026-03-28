import { webhookCloneConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { webhookCloneNodeDef } from '../definitions/webhook-clone.node';
import { WebhookCloneConfig } from '../config/WebhookCloneConfig';
import { setupWebhookAction } from '@/actions/repository/pipeline/setupWebhook.action';
import { teardownWebhookAction } from '@/actions/repository/pipeline/teardownWebhook.action';
import { type NodeManifest } from '../../types/nodeManifest';

export const webhookCloneManifest: NodeManifest = {
    type: 'webhook-clone',
    definition: webhookCloneNodeDef,
    configSchema: webhookCloneConfigSchema,
    configPanel: WebhookCloneConfig,
    lifecycle: {
        onAdd: async (repositoryId) => {
            const result = await setupWebhookAction({ repositoryId });
            if (result?.data && !result.data.configured) {
                return { success: false, error: result.data.error };
            }
            return { success: true };
        },
        onRemove: async (repositoryId, remaining) => {
            if (remaining === 0) {
                await teardownWebhookAction({ repositoryId });
            }
        },
    },
};
