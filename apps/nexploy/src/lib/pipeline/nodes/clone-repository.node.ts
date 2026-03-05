import { NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import { CloneRepositoryConfig } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';

export const cloneRepositoryNodeDef: NodeDefinition<CloneRepositoryConfig> = {
    type: 'clone-repository',
    category: 'source',
    metadata: {
        name: 'pipeline.nodes.clone-repository.name',
        description: 'pipeline.nodes.clone-repository.description',
        icon: 'GitClone',
        color: 'bg-blue-500/10 text-blue-600',
    },
    defaultConfig: {},
    handles: {
        inputs: [],
        outputs: [{ id: 'output', label: 'Next' }],
    },
    validateConfig: () => true,
};
