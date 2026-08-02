import { NodeDescriptor } from '@workspace/typescript-interface/pipeline/nodeDescriptor';
import { cherryPickCommitConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';

export const cherryPickCommitDescriptor: NodeDescriptor = {
    type: 'cherry-pick-commit',
    category: 'source',
    icon: 'GitCommit',
    description: 'Cherry-picks a specific commit onto the current branch.',
    configSchema: cherryPickCommitConfigSchema,
    outputs: [{ key: 'workDir' }, { key: 'commitHash' }],
    handles: {
        inputs: [{ id: 'input', position: 'left' }],
        outputs: [{ id: 'output', position: 'right' }],
        attachments: [],
    },
};
