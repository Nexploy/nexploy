import { Position } from '@xyflow/react';
import { NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';

export const updateServiceNodeDef: NodeDefinition = {
    id: 'update-service',
    type: 'base-node',
    category: 'deploy',
    metadata: {
        name: 'pipeline.nodes.update-service.name',
        description: 'pipeline.nodes.update-service.description',
        icon: 'RefreshCw',
        color: `${CATEGORY_BG_MUTED['deploy']} ${CATEGORY_TEXT['deploy']}`,
    },
    defaultConfig: {
        serviceName: '',
        image: '',
        tag: 'latest',
        forceUpdate: false,
    },
    handles: {
        inputs: [{ id: 'input', position: Position.Left }],
        outputs: [{ id: 'output', position: Position.Right }],
        attachments: [],
    },
};
