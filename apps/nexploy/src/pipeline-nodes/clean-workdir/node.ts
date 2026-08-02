import { NodeDescriptor } from '@workspace/typescript-interface/pipeline/nodeDescriptor';

export const cleanWorkdirDescriptor: NodeDescriptor = {
    type: 'clean-workdir',
    category: 'utility',
    icon: 'Trash2',
    isEndNode: true,
    description:
        'Deletes the cloned repository working directory to free disk space. Should be the LAST node of every pipeline that clones a repository.',
    consumesFromUpstream: ['workDir'],
    outputs: [{ key: 'cleaned' }],
    handles: {
        inputs: [{ id: 'input', position: 'left' }],
        outputs: [],
        attachments: [],
    },
};
