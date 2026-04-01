import { Position } from '@xyflow/react';
import { NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';

export const tagImageNodeDef: NodeDefinition = {
    id: 'tag-image',
    type: 'base-node',
    category: 'build',
    metadata: {
        name: 'pipeline.nodes.tag-image.name',
        description: 'pipeline.nodes.tag-image.description',
        icon: 'Tag',
        color: `${CATEGORY_BG_MUTED['build']} ${CATEGORY_TEXT['build']}`,
    },
    defaultConfig: {
        sourceImage: '',
        sourceTag: 'latest',
        targetTag: '',
    },
    handles: {
        inputs: [{ id: 'input', position: Position.Left }],
        outputs: [{ id: 'output', position: Position.Right }],
        attachments: [],
    },
};
