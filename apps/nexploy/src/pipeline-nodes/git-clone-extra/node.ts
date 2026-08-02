import { NodeDescriptor } from '@workspace/typescript-interface/pipeline/nodeDescriptor';
import { gitCloneExtraConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';

export const gitCloneExtraDescriptor: NodeDescriptor = {
    type: 'git-clone-extra',
    category: 'source',
    icon: 'GitFork',
    description: 'Clones a secondary repository (different from the main linked repo).',
    configSchema: gitCloneExtraConfigSchema,
    outputs: [{ key: 'repoUrl' }, { key: 'branch' }, { key: 'targetDir' }],
    handles: {
        inputs: [{ id: 'input', position: 'left' }],
        outputs: [{ id: 'output', position: 'right' }],
        attachments: [],
    },
};
