import { Position } from '@xyflow/react';
import { NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';

export const checkContainerLogsNodeDef: NodeDefinition = {
    id: 'check-container-logs',
    type: 'base-node',
    category: 'utility',
    metadata: {
        name: 'pipeline.nodes.check-container-logs.name',
        description: 'pipeline.nodes.check-container-logs.description',
        icon: 'ScrollText',
        color: `${CATEGORY_BG_MUTED['utility']} ${CATEGORY_TEXT['utility']}`,
    },
    defaultConfig: {
        containerName: '',
        pattern: '',
        since: '',
        timeout: 30,
        failIfFound: false,
    },
    handles: {
        inputs: [{ id: 'input', position: Position.Left }],
        outputs: [{ id: 'output', position: Position.Right }],
        attachments: [],
    },
};
