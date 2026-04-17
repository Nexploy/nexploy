import { webhookCloneConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { WebhookCloneConfig } from '../config/WebhookCloneConfig';
import { setupWebhookAction } from '@/actions/repository/pipeline/setupWebhook.action';
import { teardownWebhookAction } from '@/actions/repository/pipeline/teardownWebhook.action';
import { type NodeManifest } from '../../types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { Position } from '@xyflow/react';
import { Webhook } from 'lucide-react';

export const webhookCloneManifest: NodeManifest = {
    type: 'webhook-clone',
    definition: {
        id: 'webhook-clone',
        type: 'base-node',
        category: 'source',
        isStartNode: true,
        metadata: {
            name: 'webhook-clone.name',
            icon: Webhook,
            color: `${CATEGORY_BG_MUTED['source']} ${CATEGORY_TEXT['source']}`,
        },
        handles: {
            inputs: [],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: webhookCloneConfigSchema,
    configPanel: WebhookCloneConfig,
    inputFields: [
        { key: 'workDir', labelKey: 'pipeline.inputs.workDir', type: 'input' },
        { key: 'branch', labelKey: 'pipeline.inputs.branch', type: 'input' },
        { key: 'commitHash', labelKey: 'pipeline.inputs.commitHash', type: 'input' },
        { key: 'commitMessage', labelKey: 'pipeline.inputs.commitMessage', type: 'input' },
    ],
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
