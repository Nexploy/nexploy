import type { NodeDefinition } from '@workspace/pipeline-ui/nodeDefinition';

export interface NodeRegistryState {
    nodes: NodeDefinition[];
    getDefinition: (type: string) => NodeDefinition | undefined;
}
