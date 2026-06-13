import type { NodeDefinition } from '../pipeline/nodeDefinition';

export interface NodeRegistryState {
    nodes: NodeDefinition[];
    getDefinition: (type: string) => NodeDefinition | undefined;
}
