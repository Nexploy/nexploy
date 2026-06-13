import { create } from 'zustand';
import { ALL_NODE_DEFINITIONS, getNodeDefinition } from '@/components/pipeline/nodeRegistry';
import type { NodeRegistryState } from '@workspace/typescript-interface/stores/nodeRegistryStore';

export const useNodeRegistryStore = create<NodeRegistryState>()(() => ({
    nodes: ALL_NODE_DEFINITIONS,
    getDefinition: getNodeDefinition,
}));
