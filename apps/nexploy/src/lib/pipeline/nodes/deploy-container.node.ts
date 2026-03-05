import { NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import { DeployContainerConfig } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';

export const deployContainerNodeDef: NodeDefinition<DeployContainerConfig> = {
    type: 'deploy-container',
    category: 'deploy',
    metadata: {
        name: 'pipeline.nodes.deploy-container.name',
        description: 'pipeline.nodes.deploy-container.description',
        icon: 'Rocket',
        color: 'bg-green-500/10 text-green-600',
    },
    defaultConfig: {
        ports: [],
    },
    handles: {
        inputs: [{ id: 'input', required: true }],
        outputs: [{ id: 'output' }],
    },
    validateConfig: () => true,
};
