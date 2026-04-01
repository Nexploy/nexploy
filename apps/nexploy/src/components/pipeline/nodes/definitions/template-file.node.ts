import { Position } from '@xyflow/react';
import { NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';

export const templateFileNodeDef: NodeDefinition = {
    id: 'template-file',
    type: 'base-node',
    category: 'utility',
    metadata: {
        name: 'pipeline.nodes.template-file.name',
        description: 'pipeline.nodes.template-file.description',
        icon: 'FileCode',
        color: `${CATEGORY_BG_MUTED['utility']} ${CATEGORY_TEXT['utility']}`,
    },
    defaultConfig: {
        inputPath: '',
        outputPath: '',
        variables: [],
    },
    handles: {
        inputs: [{ id: 'input', position: Position.Left }],
        outputs: [{ id: 'output', position: Position.Right }],
        attachments: [],
    },
};
