import { Position } from '@xyflow/react';
import { NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import { CloneRepositoryConfig } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';

export const cloneRepositoryNodeDef: NodeDefinition<CloneRepositoryConfig> = {
    id: 'clone-repository',
    type: 'base-node',
    category: 'source',
    isStartNode: true,
    metadata: {
        name: 'pipeline.nodes.clone-repository.name',
        description: 'pipeline.nodes.clone-repository.description',
        icon: 'GitClone',
        color: `${CATEGORY_BG_MUTED['source']} ${CATEGORY_TEXT['source']}`,
    },
    defaultConfig: {},
    handles: {
        inputs: [],
        outputs: [{ id: 'output', position: Position.Right }],
    },
};
