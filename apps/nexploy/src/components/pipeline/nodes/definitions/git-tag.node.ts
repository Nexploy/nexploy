import { Position } from '@xyflow/react';
import { NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';

export const gitTagNodeDef: NodeDefinition = {
    id: 'git-tag',
    type: 'base-node',
    category: 'source',
    metadata: {
        name: 'pipeline.nodes.git-tag.name',
        description: 'pipeline.nodes.git-tag.description',
        icon: 'Milestone',
        color: `${CATEGORY_BG_MUTED['source']} ${CATEGORY_TEXT['source']}`,
    },
    defaultConfig: {
        tagName: '',
        message: '',
        remote: 'origin',
    },
    handles: {
        inputs: [{ id: 'input', position: Position.Left }],
        outputs: [{ id: 'output', position: Position.Right }],
        attachments: [],
    },
};
