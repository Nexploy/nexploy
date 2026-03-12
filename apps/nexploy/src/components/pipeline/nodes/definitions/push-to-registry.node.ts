import { NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { Position } from '@xyflow/react';

export const pushToRegistryNodeDef: NodeDefinition = {
    id: 'push-to-registry',
    type: 'base-node',
    category: 'build',
    metadata: {
        name: 'pipeline.nodes.push-to-registry.name',
        description: 'pipeline.nodes.push-to-registry.description',
        icon: 'Upload',
        color: `${CATEGORY_BG_MUTED['build']} ${CATEGORY_TEXT['build']}`,
    },
    defaultConfig: {
        tag: '',
    },
    handles: {
        inputs: [{ id: 'input', required: true, position: Position.Left }],
        outputs: [{ id: 'output', position: Position.Right }],
    },
};
