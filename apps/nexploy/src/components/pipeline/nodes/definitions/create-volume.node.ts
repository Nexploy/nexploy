import { Position } from '@xyflow/react';
import { NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';

export const createVolumeNodeDef: NodeDefinition = {
    id: 'create-volume',
    type: 'base-node',
    category: 'utility',
    metadata: {
        name: 'pipeline.nodes.create-volume.name',
        description: 'pipeline.nodes.create-volume.description',
        icon: 'HardDrive',
        color: `${CATEGORY_BG_MUTED['utility']} ${CATEGORY_TEXT['utility']}`,
    },
    defaultConfig: {
        name: '',
    },
    handles: {
        inputs: [{ id: 'input', position: Position.Left }],
        outputs: [{ id: 'output', position: Position.Right }],
        attachments: [],
    },
};
