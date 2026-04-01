import { Position } from '@xyflow/react';
import { NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';

export const pruneImagesNodeDef: NodeDefinition = {
    id: 'prune-images',
    type: 'base-node',
    category: 'build',
    metadata: {
        name: 'pipeline.nodes.prune-images.name',
        description: 'pipeline.nodes.prune-images.description',
        icon: 'Trash2',
        color: `${CATEGORY_BG_MUTED['build']} ${CATEGORY_TEXT['build']}`,
    },
    defaultConfig: {
        filter: '',
        olderThan: '',
        dangling: true,
    },
    handles: {
        inputs: [{ id: 'input', position: Position.Left }],
        outputs: [{ id: 'output', position: Position.Right }],
        attachments: [],
    },
};
