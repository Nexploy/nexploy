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
        {
            key: 'workDir',
            labelKey: 'pipeline.inputs.workDir',
            descriptionKey: 'pipeline.inputs.desc_workDir',
            type: 'input',
        },
        {
            key: 'branch',
            labelKey: 'pipeline.inputs.branch',
            descriptionKey: 'pipeline.inputs.desc_branch',
            type: 'input',
        },
        {
            key: 'commitHash',
            labelKey: 'pipeline.inputs.commitHash',
            descriptionKey: 'pipeline.inputs.desc_commitHash',
            type: 'input',
        },
        {
            key: 'commitMessage',
            labelKey: 'pipeline.inputs.commitMessage',
            descriptionKey: 'pipeline.inputs.desc_commitMessage',
            type: 'input',
        },
    ],
    lifecycle: {
        onAdd: async (repositoryId) => {
            await setupWebhookAction({ repositoryId });
        },
        onRemove: async (repositoryId, remaining) => {
            if (remaining === 0) {
                await teardownWebhookAction({ repositoryId });
            }
        },
    },
};
