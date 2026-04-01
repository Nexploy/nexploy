import { Position } from '@xyflow/react';
import { NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';

export const runCommandInContainerNodeDef: NodeDefinition = {
    id: 'run-command-in-container',
    type: 'base-node',
    category: 'utility',
    metadata: {
        name: 'pipeline.nodes.run-command-in-container.name',
        description: 'pipeline.nodes.run-command-in-container.description',
        icon: 'SquareTerminal',
        color: `${CATEGORY_BG_MUTED['utility']} ${CATEGORY_TEXT['utility']}`,
    },
    defaultConfig: {
        containerName: '',
        command: '',
        workdir: '',
    },
    handles: {
        inputs: [{ id: 'input', position: Position.Left }],
        outputs: [{ id: 'output', position: Position.Right }],
        attachments: [],
    },
};
