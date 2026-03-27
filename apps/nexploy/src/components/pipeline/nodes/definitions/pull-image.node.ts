import { Position } from '@xyflow/react';
import { NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';

export const pullImageNodeDef: NodeDefinition = {
    id: 'pull-image',
    type: 'base-node',
    category: 'build',
    metadata: {
        name: 'pipeline.nodes.pull-image.name',
        description: 'pipeline.nodes.pull-image.description',
        icon: 'Download',
        color: `${CATEGORY_BG_MUTED['build']} ${CATEGORY_TEXT['build']}`,
    },
    defaultConfig: {
        imageName: '',
    },
    handles: {
        inputs: [{ id: 'input', position: Position.Left }],
        outputs: [{ id: 'output', position: Position.Right }],
        attachments: [],
    },
};
