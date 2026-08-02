import { NodeDescriptor } from '@workspace/typescript-interface/pipeline/nodeDescriptor';
import { mergeBranchConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';

export const mergeBranchDescriptor: NodeDescriptor = {
    type: 'merge-branch',
    category: 'source',
    icon: 'GitMerge',
    description: 'Merges a branch into the current branch.',
    configSchema: mergeBranchConfigSchema,
    outputs: [{ key: 'workDir' }, { key: 'targetBranch' }, { key: 'sourceBranch' }],
    handles: {
        inputs: [{ id: 'input', position: 'left' }],
        outputs: [{ id: 'output', position: 'right' }],
        attachments: [],
    },
};
