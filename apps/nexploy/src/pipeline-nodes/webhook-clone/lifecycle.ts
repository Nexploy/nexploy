import { type NodeLifecycleCallbacks } from '@workspace/typescript-interface/pipeline/node';
import { setupWebhookAction } from '@/actions/repository/pipeline/setupWebhook.action';
import { teardownWebhookAction } from '@/actions/repository/pipeline/teardownWebhook.action';

export const webhookCloneLifecycle: NodeLifecycleCallbacks = {
    onAdd: async (repositoryId) => {
        await setupWebhookAction({ repositoryId });
    },
    onRemove: async (repositoryId, remaining) => {
        if (remaining === 0) {
            await teardownWebhookAction({ repositoryId });
        }
    },
};
