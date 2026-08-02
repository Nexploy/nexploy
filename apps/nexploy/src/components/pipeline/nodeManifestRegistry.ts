import { z } from 'zod';
import { type NodeDefinition } from '@nexploy/node-ui/nodeDefinition';
import { type NodeInputField, type NodeManifest } from '@nexploy/node-ui/nodeManifest';
import { allBuiltinManifests } from '@nexploy/nodes/registry/client';

const builtinRegistry = new Map<string, NodeManifest>(
    allBuiltinManifests.map((m) => [m.type, m] as [string, NodeManifest]),
);

const customRegistry = new Map<string, NodeManifest>();

function getManifest(type: string): NodeManifest | undefined {
    return builtinRegistry.get(type) ?? customRegistry.get(type);
}

export function registerNodeManifest(manifest: NodeManifest): void {
    customRegistry.set(manifest.type, manifest);
}

export function getAllNodeDefinitions(): NodeDefinition[] {
    return [...builtinRegistry.values(), ...customRegistry.values()].map((m) => m.definition);
}

export function getNodeDefinition(type: string): NodeDefinition | undefined {
    return getManifest(type)?.definition;
}

export function hasConfigSchema(type: string): boolean {
    return !!getManifest(type)?.configSchema;
}

export function getConfigSchema(type: string) {
    return getManifest(type)?.configSchema ?? z.object({});
}

export function getConfigDefaults(type: string): Record<string, unknown> {
    const schema = getManifest(type)?.configSchema;
    if (!schema || !(schema instanceof z.ZodObject)) return {};
    return z.object(schema.shape).partial().safeParse({}).data ?? {};
}

export function getConfigPanel(type: string) {
    return getManifest(type)?.configPanel;
}

export function getNodeLifecycle(type: string) {
    return getManifest(type)?.lifecycle;
}

export function getNodeInputFields(type: string): NodeInputField[] | undefined {
    return getManifest(type)?.inputFields;
}
