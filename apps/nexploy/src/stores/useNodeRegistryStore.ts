import { create } from 'zustand';
import { NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import { ALL_NODE_DEFINITIONS, getNodeDefinition } from '@/components/pipeline/nodeRegistry';

interface NodeRegistryState {
    nodes: NodeDefinition[];
    getDefinition: (type: string) => NodeDefinition | undefined;
}

export const useNodeRegistryStore = create<NodeRegistryState>()(() => ({
    nodes: ALL_NODE_DEFINITIONS,
    getDefinition: getNodeDefinition,
}));
