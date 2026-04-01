import { Position } from '@xyflow/react';
import { NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';

export const runScriptNodeDef: NodeDefinition = {
    id: 'run-script',
    type: 'base-node',
    category: 'utility',
    metadata: {
        name: 'pipeline.nodes.run-script.name',
        description: 'pipeline.nodes.run-script.description',
        icon: 'Terminal',
        color: `${CATEGORY_BG_MUTED['utility']} ${CATEGORY_TEXT['utility']}`,
    },
    defaultConfig: {
        script: '',
        shell: 'bash',
        continueOnError: false,
    },
    handles: {
        inputs: [{ id: 'input', position: Position.Left }],
        outputs: [{ id: 'output', position: Position.Right }],
        attachments: [],
    },
};
