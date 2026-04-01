import { Position } from '@xyflow/react';
import { NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';

export const downloadFileNodeDef: NodeDefinition = {
    id: 'download-file',
    type: 'base-node',
    category: 'utility',
    metadata: {
        name: 'pipeline.nodes.download-file.name',
        description: 'pipeline.nodes.download-file.description',
        icon: 'Download',
        color: `${CATEGORY_BG_MUTED['utility']} ${CATEGORY_TEXT['utility']}`,
    },
    defaultConfig: {
        url: '',
        destinationPath: '',
        filename: '',
    },
    handles: {
        inputs: [{ id: 'input', position: Position.Left }],
        outputs: [{ id: 'output', position: Position.Right }],
        attachments: [],
    },
};
