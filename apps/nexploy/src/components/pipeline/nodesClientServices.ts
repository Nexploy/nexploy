import { type NodeClientServices } from '@nexploy/nodes/core/nodeServices';
import { setupWebhookAction } from '@/actions/repository/pipeline/setupWebhook.action';
import { teardownWebhookAction } from '@/actions/repository/pipeline/teardownWebhook.action';

export const nodesClientServices: NodeClientServices = {
    webhook: {
        async setup(repositoryId) {
            await setupWebhookAction({ repositoryId });
        },
        async teardown(repositoryId) {
            await teardownWebhookAction({ repositoryId });
        },
    },
};
