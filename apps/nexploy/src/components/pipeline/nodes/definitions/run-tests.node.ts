import { Position } from '@xyflow/react';
import { NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';

export const runTestsNodeDef: NodeDefinition = {
    id: 'run-tests',
    type: 'base-node',
    category: 'utility',
    metadata: {
        name: 'pipeline.nodes.run-tests.name',
        description: 'pipeline.nodes.run-tests.description',
        icon: 'FlaskConical',
        color: `${CATEGORY_BG_MUTED['utility']} ${CATEGORY_TEXT['utility']}`,
    },
    defaultConfig: {
        command: '',
        image: 'node:20-alpine',
        workdir: '/workspace',
    },
    handles: {
        inputs: [{ id: 'input', position: Position.Left }],
        outputs: [{ id: 'output', position: Position.Right }],
        attachments: [],
    },
};
