import { NodeDescriptor } from '@workspace/pipeline-core/nodeDescriptor';
import { webhookCloneConfigSchema } from '@workspace/pipeline-core/schemas/nodeConfigs.schema';

export const webhookCloneDescriptor: NodeDescriptor = {
    type: 'webhook-clone',
    category: 'source',
    icon: 'Webhook',
    isStartNode: true,
    description: 'Clones the repository when triggered by a webhook push event.',
    configSchema: webhookCloneConfigSchema,
    outputs: [
        { key: 'skipped', internal: true },
        { key: 'reason', internal: true },
        { key: 'workDir' },
        { key: 'branch' },
        { key: 'commitHash' },
        { key: 'commitMessage' },
        { key: 'event', labelKey: 'pipeline.inputs.webhookEvent', descriptionKey: 'pipeline.inputs.desc_webhookEvent' },
        { key: 'tagName' },
        { key: 'targetBranch' },
        { key: 'mergeRequestAction' },
    ],
    handles: {
        inputs: [],
        outputs: [{ id: 'output', position: 'right' }],
        attachments: [],
    },
};
