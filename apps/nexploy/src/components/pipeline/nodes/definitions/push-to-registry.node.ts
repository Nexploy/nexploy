import { NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';

export const pushToRegistryNodeDef: NodeDefinition = {
    type: 'push-to-registry',
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
        inputs: [{ id: 'input', required: true }],
        outputs: [{ id: 'output' }],
    },
};
