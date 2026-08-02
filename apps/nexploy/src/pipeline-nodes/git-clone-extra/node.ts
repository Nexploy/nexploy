import { NodeDescriptor } from '@workspace/pipeline-core/nodeDescriptor';
import { gitCloneExtraConfigSchema } from '@workspace/pipeline-core/schemas/nodeConfigs.schema';

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
