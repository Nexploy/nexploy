import { Position } from '@xyflow/react';
import { NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';

export const updateCommitStatusNodeDef: NodeDefinition = {
    id: 'update-commit-status',
    type: 'base-node',
    category: 'utility',
    metadata: {
        name: 'pipeline.nodes.update-commit-status.name',
        description: 'pipeline.nodes.update-commit-status.description',
        icon: 'GitCommit',
        color: `${CATEGORY_BG_MUTED['utility']} ${CATEGORY_TEXT['utility']}`,
    },
    defaultConfig: {
        provider: 'github',
        token: '',
        owner: '',
        repo: '',
        sha: '',
        state: 'pending',
        description: '',
        targetUrl: '',
    },
    handles: {
        inputs: [{ id: 'input', position: Position.Left }],
        outputs: [{ id: 'output', position: Position.Right }],
        attachments: [],
    },
};
