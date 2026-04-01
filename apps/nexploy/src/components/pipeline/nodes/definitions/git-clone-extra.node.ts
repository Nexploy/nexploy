import { Position } from '@xyflow/react';
import { NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';

export const gitCloneExtraNodeDef: NodeDefinition = {
    id: 'git-clone-extra',
    type: 'base-node',
    category: 'source',
    metadata: {
        name: 'pipeline.nodes.git-clone-extra.name',
        description: 'pipeline.nodes.git-clone-extra.description',
        icon: 'GitFork',
        color: `${CATEGORY_BG_MUTED['source']} ${CATEGORY_TEXT['source']}`,
    },
    defaultConfig: {
        repoUrl: '',
        branch: 'main',
        targetDir: '',
        token: '',
    },
    handles: {
        inputs: [{ id: 'input', position: Position.Left }],
        outputs: [{ id: 'output', position: Position.Right }],
        attachments: [],
    },
};
