import { NodeDescriptor } from '@workspace/pipeline-core/nodeDescriptor';
import { updateCommitStatusConfigSchema } from '@workspace/pipeline-core/schemas/nodeConfigs.schema';

export const updateCommitStatusDescriptor: NodeDescriptor = {
    type: 'update-commit-status',
    category: 'integration',
    icon: 'GitCommit',
    description: 'Updates the commit status on GitHub/GitLab (pending/success/failure).',
    configSchema: updateCommitStatusConfigSchema,
    outputs: [{ key: 'provider' }, { key: 'state' }, { key: 'sha' }, { key: 'context' }, { key: 'description' }],
    handles: {
        inputs: [{ id: 'input', position: 'left' }],
        outputs: [{ id: 'output', position: 'right' }],
        attachments: [],
    },
};
