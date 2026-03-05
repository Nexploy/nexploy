import { NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';

const nodeRegistry = new Map<string, NodeDefinition>();

export function registerNode(def: NodeDefinition): void {
    nodeRegistry.set(def.type, def);
}

export function getNodeDefinition(type: string): NodeDefinition | undefined {
    return nodeRegistry.get(type);
}

export function getAllNodeDefinitions(): NodeDefinition[] {
    return Array.from(nodeRegistry.values());
}
